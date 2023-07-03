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

function responseFunc(header){

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

  

  return response;

}

module.exports = { generateOTP, isSessionExpired, generateRandomToken, responseFunc };
