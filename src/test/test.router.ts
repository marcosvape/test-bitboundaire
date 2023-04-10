/**
 * Required External Modules and Interfaces
 */

 import express, { Request, Response } from "express";
 import * as TestService from "./test.service";
 const http = require('http');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

/**
 * Router Definition
 */

 export const testRouter = express.Router();

/**
 * Controller Definitions
 */

testRouter.get("/callback", async (req: Request, res: Response) => {
  try {

    let fileUrl = req.query.RecordingUrl;

    console.log(fileUrl)

    const data = await TestService.callbackTwillio(fileUrl);
    res.status(201).json(data);

  } catch (e) {
    console.log(e)
    res.status(500).send("error");

  }
});

testRouter.get("/receiveCall", async (req: Request, res: Response) => {
  const twiml = new VoiceResponse();

  // twiml.say('Hello from your pals at Twilio! Have fun.');

  twiml.say('Please leave a message at the beep.\nPress the star key when finished.');
  twiml.record({
      action: `${process.env.NGROK_URL}`,
      method: 'GET',
      maxLength: 20,
      finishOnKey: '*'
  });
  twiml.say('I did not receive a recording');

  console.log(twiml.toString());

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});