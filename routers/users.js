const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = require("../model/user");
const { User } = require("../model/user");
const jwt = require("jsonwebtoken");
const verifyJWT = require("../middleWares/webToken");

//get user
router.get("/me/:email", verifyJWT, async (req, res) => {
  try {
    const email = req.params.email;
    // console.log(email);
    const user = await User.findOne({ email: email });
    res.send(user);
  } catch (error) {
    res.send(error);
  }
});

//signup
router.put("/login", async (req, res) => {
  try {
    const userEmail = req.body.email;
    const exist = await User.findOne({ email: userEmail });
    // const newUser = new User({
    //   name: req.body.name,
    //   email: req.body.email,
    //   status: req.body.status,
    // });
    const filter = { email: req.body.email };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        name: req.body.name,
        email: req.body.email,
        status: req.body.status,
      },
    };
    User.findOneAndUpdate(filter, updateDoc, options, (err, data) => {
      if (err) {
        res.send({ message: err.message });
      } else {
        var token = jwt.sign({ foo: req.body.email }, process.env.JWT_SECRET_KEY, {
          expiresIn: "1d",
        });
        res.status(200).send({ token: token, message: "signup was successfully" });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

//friends request
router.put("/friend-request/:id", async (req, res, next) => {
  try {
    const requesterEmail = req.body.email;
    const receiverId = req.params.id;

    const receiver = await User.findOne({ _id: receiverId });
    const sender = await User.findOne({ email: requesterEmail });

    const receiverRequests = receiver.friendsRequest;
    const senderSendRequests = sender.sendRequest;
    const senderFriends = sender.friends;
    if (senderFriends) {
      const isExistFriend = senderFriends.find((req) => req === receiver.email);
      if (isExistFriend) {
        next("already send Request");
        return;
      }
    }
    const isExistReceiver = receiverRequests.find((req) => req === requesterEmail);
    if (isExistReceiver) {
      next("already send Request");
      return;
    }

    const receiverRequestsUpdate = [...receiverRequests, requesterEmail];
    const senderSendRequestUpdate = [...senderSendRequests, receiver.email];

    // console.log("update", receiverRequestsUpdate, senderSendRequestUpdate);

    const receiverFilter = { email: receiver.email };
    const senderFilter = { email: requesterEmail };
    // console.log("filter", receiverFilter, senderFilter);

    const options = { upsert: true };

    const receiverUpdateDoc = {
      $set: {
        friendsRequest: receiverRequestsUpdate,
      },
    };

    const senderUpdateDoc = {
      $set: {
        sendRequest: senderSendRequestUpdate,
      },
    };

    // console.log("doc,", receiverUpdateDoc, senderUpdateDoc);

    //update
    const receiverRequestUpdate = await User.findOneAndUpdate(
      receiverFilter,
      receiverUpdateDoc,
      options
    );
    const senderRequestUpdate = await User.findOneAndUpdate(senderFilter, senderUpdateDoc, options);

    console.log("result", receiverRequestUpdate, senderRequestUpdate);

    // // console.log("request", request);
    // const me = await User.findOne({ email: req.body.email });
    // const myRequests = me.friendsRequest;
    // myRequests.push(exist.email);
    // const query = { email: req.body.email };
    // const updateDocs = {
    //   $set: {
    //     sendRequest: myRequests,
    //   },
    // };
    // const result = await User.findOneAndUpdate(query, updateDocs, options);
    // res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

//get users
router.get("/users", verifyJWT, async (req, res) => {
  try {
    User.find({}, (err, data) => {
      if (err) {
        res.send(err.message);
      } else {
        res.send(data);
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

//accept friend request
router.put("/accept-request/:email", verifyJWT, async (req, res) => {
  try {
    const accepterEmail = req.params.email;
    const requesterEmail = req.body.request;

    const accepter = await User.findOne({ email: accepterEmail });
    const requester = await User.findOne({ email: requesterEmail });

    const accepterExistFriendsRequest = accepter.friendsRequest.filter((r) => r !== requesterEmail);
    const requesterExistSendRequest = requester.sendRequest.filter((r) => r !== accepterEmail);

    // console.log("request", accepterExistFriendsRequest);

    const accepterAddFriend = [...accepter.friends, requesterEmail];
    const requesterAddFriend = [...requester.friends, accepterEmail];

    const accepterFilter = { email: accepterEmail };
    const requesterFilter = { email: requesterEmail };

    const options = { upsert: true };

    // console.log("addFriends", accepterAddFriend, requesterAddFriend);

    const accepterUpdateDoc = {
      $set: {
        friendsRequest: accepterExistFriendsRequest,
        friends: accepterAddFriend,
      },
    };

    const requesterUpdateDoc = {
      $set: {
        sendRequest: requesterExistSendRequest,
        friends: requesterAddFriend,
      },
    };

    const accepterResult = await User.findOneAndUpdate(accepterFilter, accepterUpdateDoc, options);
    const requesterResult = await User.findOneAndUpdate(
      requesterFilter,
      requesterUpdateDoc,
      options
    );
    res.send({ accepterResult, requesterResult });
    // console.log("friends", accepterResult, requesterResult);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

//get all requests
router.get("/friends-request/:email", verifyJWT, async (req, res) => {
  try {
    const email = req.params.email;
    const exist = await User.findOne({ email: email }).select("friendsRequest");

    // const emails = exist.friendsRequest.map((e) => {
    //   return { email: e };
    // });

    const query = { email: { $in: exist.friendsRequest } };
    const result = await User.find(query);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

//get all friends
router.get("/allFriends/:email", verifyJWT, async (req, res) => {
  try {
    const email = req.params.email;
    console.log(email);
    const exist = await User.findOne({ email: email }).select("friends");
    const query = { email: { $in: exist.friends } };
    const result = await User.find(query);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

//get all friends
router.post("/show-friends", verifyJWT, async (req, res) => {
  try {
    const email = req.body.friends;
    const query = { email: { $in: email } };
    const result = await User.find(query);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

// relation
router.post("/relation", verifyJWT, async (req, res) => {
  try {
    const email = req.body.friends;
    const query = { email: { $in: email } };
    const result = await User.find(query);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});
// search-relation
router.post("/search-relation", verifyJWT, async (req, res) => {
  try {
    const emails = req.body.friends;
    console.log(emails);
    // const query = { email: { $in: email } };
    // const result = await User.find(query);
    // res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

// search-name
router.get("/search-name/:email", verifyJWT, async (req, res) => {
  try {
    const email = req.params.email;
    // console.log(email);
    const result = await User.findOne({ email: email });
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

// get all users
router.get("/all-users", verifyJWT, async (req, res) => {
  try {
    const result = await User.find({});
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

router.get("/isFriend/:email", verifyJWT, async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email: email });
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
});

module.exports = router;
