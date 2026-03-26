import {
  MediaConvertClient,
  CreateJobCommand,
  GetJobCommand,
  type CreateJobCommandInput,
} from "@aws-sdk/client-mediaconvert";

const client = new MediaConvertClient({
  region: process.env.AWS_REGION!,
  endpoint: process.env.MEDIACONVERT_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Creates a MediaConvert job to transcode a .webm file to .mp4 (H.264 + AAC).
 * The output is placed in the same S3 directory as the input, with .mp4 extension.
 *
 * Returns the MediaConvert job ID.
 */
export async function createTranscodeJob(s3Key: string): Promise<string> {
  const bucket = process.env.S3_BUCKET_NAME!;
  const inputPath = `s3://${bucket}/${s3Key}`;

  // Output goes to same directory, replacing .webm with empty string
  // MediaConvert appends the name modifier + extension automatically
  const outputDir = s3Key.substring(0, s3Key.lastIndexOf("/") + 1);
  const outputPath = `s3://${bucket}/${outputDir}`;

  const params: CreateJobCommandInput = {
    Role: process.env.MEDIACONVERT_ROLE_ARN!,
    Settings: {
      Inputs: [
        {
          FileInput: inputPath,
          AudioSelectors: {
            "Audio Selector 1": {
              DefaultSelection: "DEFAULT",
            },
          },
          VideoSelector: {},
          TimecodeSource: "ZEROBASED",
        },
      ],
      OutputGroups: [
        {
          Name: "MP4 Output",
          OutputGroupSettings: {
            Type: "FILE_GROUP_SETTINGS",
            FileGroupSettings: {
              Destination: outputPath,
            },
          },
          Outputs: [
            {
              ContainerSettings: {
                Container: "MP4",
                Mp4Settings: {},
              },
              VideoDescription: {
                CodecSettings: {
                  Codec: "H_264",
                  H264Settings: {
                    RateControlMode: "QVBR",
                    QvbrSettings: {
                      QvbrQualityLevel: 7,
                    },
                    MaxBitrate: 5000000,
                    CodecProfile: "HIGH",
                    CodecLevel: "AUTO",
                    FramerateControl: "INITIALIZE_FROM_SOURCE",
                    GopSize: 2,
                    GopSizeUnits: "SECONDS",
                  },
                },
                Width: 1920,
                Height: 1080,
                ScalingBehavior: "DEFAULT",
                RespondToAfd: "NONE",
              },
              AudioDescriptions: [
                {
                  CodecSettings: {
                    Codec: "AAC",
                    AacSettings: {
                      Bitrate: 128000,
                      CodingMode: "CODING_MODE_2_0",
                      SampleRate: 48000,
                    },
                  },
                  AudioSourceName: "Audio Selector 1",
                },
              ],
              NameModifier: "_transcoded",
            },
          ],
        },
      ],
      TimecodeConfig: {
        Source: "ZEROBASED",
      },
    },
    StatusUpdateInterval: "SECONDS_30",
  };

  const command = new CreateJobCommand(params);
  const response = await client.send(command);

  if (!response.Job?.Id) {
    throw new Error("MediaConvert job creation failed - no job ID returned");
  }

  return response.Job.Id;
}

/**
 * Checks the status of a MediaConvert job.
 * Returns the job status and the output S3 key if complete.
 */
export async function getJobStatus(jobId: string): Promise<{
  status: "SUBMITTED" | "PROGRESSING" | "COMPLETE" | "CANCELED" | "ERROR";
  outputKey?: string;
  errorMessage?: string;
}> {
  const command = new GetJobCommand({ Id: jobId });
  const response = await client.send(command);

  const job = response.Job;
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const status = job.Status as "SUBMITTED" | "PROGRESSING" | "COMPLETE" | "CANCELED" | "ERROR";

  if (status === "COMPLETE") {
    // Extract the output file path from the job
    const outputGroup = job.Settings?.OutputGroups?.[0];
    const destination = outputGroup?.OutputGroupSettings?.FileGroupSettings?.Destination;
    const nameModifier = outputGroup?.Outputs?.[0]?.NameModifier || "_transcoded";

    if (destination) {
      // MediaConvert output path is: destination + input_filename_without_ext + nameModifier + .mp4
      // We need to reconstruct the output key from the input key
      const input = job.Settings?.Inputs?.[0]?.FileInput;
      if (input) {
        const inputFilename = input.substring(input.lastIndexOf("/") + 1);
        const inputBasename = inputFilename.replace(/\.[^.]+$/, "");
        const bucket = process.env.S3_BUCKET_NAME!;
        const destPrefix = destination.replace(`s3://${bucket}/`, "");
        const outputKey = `${destPrefix}${inputBasename}${nameModifier}.mp4`;
        return { status, outputKey };
      }
    }
    return { status };
  }

  if (status === "ERROR") {
    return {
      status,
      errorMessage: job.ErrorMessage || "Unknown transcoding error",
    };
  }

  return { status };
}
