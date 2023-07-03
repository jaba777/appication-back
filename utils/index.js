function generateOTP(length) {
  const nums = "0123456789";
  let res = "";
  for (let i = 0; i < length; i++) {
    const ind = Math.floor(Math.random() * nums.length);
    res += nums[ind];
  }
  return res;
}
function generateRandomToken(length) {
  const nums = "0a1b2c3d4e5fdg6h7i8j9k1l2m3n4o5p6q7r8s9t0u";
  let res = "";
  for (let i = 0; i < length; i++) {
    const ind = Math.floor(Math.random() * nums.length);
    res += nums[ind];
  }
  return res;
}

function isSessionExpired(sessionData, maxAge) {
  const currentTime = Date.now();

  return maxAge > currentTime - sessionData;
}
const request = require("@arangodb/request");

function responseFunc(phoneNumber,randomNum,config) {
  
  const responseURL = request.post(config.url, {
    headers: { Authorization: config.apiKey },
    body: {
      variables_values: randomNum,
      route: "otp",
      numbers: phoneNumber,
    },
    json: true,
  });

  return responseURL;
}


module.exports = {
  generateOTP,
  isSessionExpired,
  generateRandomToken,
  responseFunc
};
