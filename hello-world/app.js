let config = require("./config.json");
let AWS = require("aws-sdk");
let nodemailer = require("nodemailer");
const pug = require("pug");

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.lambdaHandler = async (event, context) => {
  const { firstName, lastName, email, number, zipCode, restaurant } =
    JSON.parse(event.body);

  const html1 = pug.renderFile(`${__dirname}/template/welcome.pug`, {
    firstName: firstName,
  });

  const html2 = pug.renderFile(`${__dirname}/template/newMsg.pug`, {
    firstName: firstName,
    lastName: lastName,
    email: email,
    number: number,
    zipCode: zipCode,
    restaurant: restaurant,
  });

  let transporter = nodemailer.createTransport({
    SES: new AWS.SES({
      apiVersion: "2010-12-01",
      region: process.env.AWS_REGION,
    }),
  });

  const params = {
    from: config.EMAIL_SENDER,
    to: email,
    subject: "Thank you for getting in touch",
    html: html1,
  };

  const params2 = {
    from: config.EMAIL_SENDER,
    to: config.COMPANY_email,
    subject: `we get new email from ${firstName} ${lastName}`,
    html: html2,
  };

  try {
    await transporter.sendMail(params);
    await transporter.sendMail(params2);

    return sendResponse(
      200,
      JSON.stringify({
        message: `Email sent! to : ${email}`,
      })
    );
  } catch (e) {
    console.error(e);
    return sendResponse(
      400,
      JSON.stringify({
        message: `sending failed to : ${email}`,
      })
    );
  }
};

function sendResponse(statusCode, message) {
  const response = {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*",
    },
    body: message,
  };
  return response;
}
