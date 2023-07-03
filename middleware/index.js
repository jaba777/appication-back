"use strict";

function checkSmsCookieTimeValidation(req, res, next) {
  try {
    const cookie = req.cookie("smsValidTime");
    if (cookie) {
      next();
    } else {
      throw new Error("Your Verify number is not valid anymore");
    }
  } catch (error) {
    res.send({ status: 400, error: "Your Verify number is not valid anymore" });
  }
}
function checkSessionCookieTimeValidation(req, res, next) {
  try {
    const sessionId = req.cookie("SessionId");
    if (sessionId) {
      next();
    } else {
      throw new Error("Your session is not valid anymore");
    }
  } catch (error) {
    res.send({
      status: 400,
      error: "You have logged out for safety, try again",
    });
  }
}

module.exports = {
  checkSmsCookieTimeValidation,
  checkSessionCookieTimeValidation,
};
