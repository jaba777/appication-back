"use strict";

const createRouter = require("@arangodb/foxx/router");
const router = createRouter();
const joi = require("joi");
const db = require("@arangodb").db;
const sessionDetails = db._collection("sessionDetails");

const catalogColl = db._collection("catalog");
const productColl = db._collection("products");

const aql = require("@arangodb").aql;
const request = require("@arangodb/request");
const {
  generateOTP,
  isSessionExpired,
  generateRandomToken,
} = require("./utils/index");
const {
  checkSmsCookieTimeValidation,
  checkSessionCookieTimeValidation,
} = require("./middleware/index");
module.context.use(router);

// 3 hour
const maxAge = 5 * 60 * 60 * 1000;

router
  .post("/createSession", (req, res) => {
    try {
      const { phoneNumber } = req.body;
      const randomNum = generateOTP(6);
      const url = module.context.configuration.SMTP_BASE_URL;
      const apiKey = module.context.configuration.API_KEY_SMTP;

      const response = request.post(url, {
        headers: { Authorization: apiKey },
        body: {
          variables_values: randomNum,
          route: "otp",
          numbers: phoneNumber,
        },
        json: true,
      });

      if (response.status === 200 && response.json.return === true) {
        const sessionCreationTime = Date.now();
        const meta = sessionDetails.save({
          ...req.body,
          sessionId: randomNum,
          time: sessionCreationTime,
        });
        res.cookie("smsValidTime", randomNum, {
          httpOnly: true,
          ttl: 60, //60 sec
        });
        res.send({
          sessionId: randomNum,
          response: response.json,
          meta: meta,
        });
      } else {
        throw new Error(500, "Failed to send OTP");
      }
    } catch (error) {
      res.status(500).send({ status: "ok", error: "Failed to send OTP" });
    }
  })
  .body(
    joi.object().keys({ phoneNumber: joi.string().required() }).required(),
    "body"
  )
  .summary("Create Session")
  .description(
    "Create a new session and send OTP to the provided phone number"
  );

router
  .post("/verifyOTP", checkSmsCookieTimeValidation, (req, res) => {
    try {
      const { sessionId, otp } = req.body;

      const sessionData = sessionDetails.firstExample({ sessionId }); //firstExample is build function of arrangodb

      const url = module.context.configuration.SMTP_BASE_URL;
      const apiKey = module.context.configuration.API_KEY_SMTP;

      const response = request.post(url, {
        headers: { Authorization: apiKey },
        body: {
          message: `Your OTP is ${otp}`,
          variables_values: sessionData.sessionId,
          route: "otp",
          numbers: sessionData.phoneNumber,
        },
        json: true,
      });

      const randomToken = generateRandomToken(50);
      res.cookie("SessionId", randomToken, {
        httpOnly: true,
        ttl: maxAge,
      });

      if (response.status === 200 && response.json.return === true) {
        sessionDetails.update(sessionData._id, { verified: true });
        res.send({ message: "OTP verification successful" });
      } else {
        res.send({ message: "no active account" });
      }
    } catch (error) {
      res.throw(500, error);
    }
  })
  .body(
    joi
      .object()
      .keys({
        sessionId: joi.string().required(),
        otp: joi.string().required(),
      })
      .required(),
    "body"
  )
  .summary("Verify OTP")
  .description("Verify the OTP entered by the user using the Fast2SMS API");

router
  .get("/catalog", checkSessionCookieTimeValidation, (req, res) => {
    try {
      const keys = db._query(aql`
      FOR entry IN ${catalogColl}
      RETURN { name: entry.name, currency: entry.defaultCurrencyUnit, key: entry._key, availableQuantity: entry.availableQuantity, photo:entry.primaryImage}
    `);
      if (keys) {
        res.status(200).send({ status: "ok", keys });
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(400).send({
        status: "bad",
        error: "your session time is over, try log in again",
      });
    }
  })
  .response(
    joi.array().items(joi.string().required()).required(),
    "List of entries from catalog collection."
  )
  .summary("API lists few entries from the catalog collection")
  .description("API lists few entries from the catalog collection.");
