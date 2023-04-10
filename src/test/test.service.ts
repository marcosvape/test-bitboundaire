/**
 * Required External Modules
 */

 import fetch, { RequestInit } from 'node-fetch'

 import xml2js from 'xml2js'

 const speech = require('@google-cloud/speech');

 const http = require('http');

const VoiceResponse = require('twilio').twiml.VoiceResponse;

const client = new speech.SpeechClient();

 const parser = new xml2js.Parser()

import { join, parse } from "path";
import { URL } from "url";
import { Storage } from '@google-cloud/storage';
const request = require('request');

/**
 * In-Memory Store
 */

/**
 * Service Methods
 */

export async function callbackTwillio(fileUrl: string) {
const gcsFile = await uploadFileGcs(fileUrl)

const gcsUri = `gs://${process.env.BUCKET_NAME}/${gcsFile.metadata.name}`;

// The audio file's encoding, sample rate in hertz, and BCP-47 language code
const audio = {
  uri: gcsUri,
};
const config = {
  encoding: 'LINEAR16',
  languageCode: 'en-US',
};
const request = {
  audio: audio,
  config: config,
};

// Detects speech in the audio file
const [response] = await client.recognize(request);
const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
console.log(`Transcription: ${transcription}`);
}

/**
 * This function takes a http url and uploads it to a destination in the bucket
 * under the same filename or a generated unique name.
 */
export async function uploadFileGcs(
  fileUrl: string,
  destinationDir: string = ""
) {
  console.log("Upload file from", fileUrl);
  const pathname = new URL(fileUrl).pathname;
  const { ext, base } = parse(pathname);
  let destination = join(destinationDir, base);
  const storage = new Storage();

  const bucket = storage.bucket(`${process.env.BUCKET_NAME}`);

  return new Promise<File>((resolve, reject) => {
    const file = bucket.file(destination);

    const req = request(fileUrl);
    req.pause();
    req.on("response", res => {
      if (res.statusCode !== 200) {
        return reject(
          new Error(
            `Failed to request file from url: ${fileUrl}, status code: ${res.statusCode}`
          )
        );
      }

      req
        .pipe(
          file.createWriteStream({
            resumable: false,
            metadata: {
              contentType: res.headers["content-type"]
            }
          })
        )
        .on("error", err => {
          reject(
            new Error(
              `Failed to upload ${fileUrl} to ${destinationDir}: ${err.message}`
            )
          );
        })
        .on("finish", () => {
          console.log(`Successfully uploaded ${fileUrl} to ${destination}`);
          resolve(file);
        });
      req.resume();
    });
  });
}