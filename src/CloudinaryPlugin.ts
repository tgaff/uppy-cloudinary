import * as Uppy from '@uppy/core';
import CloudinaryApiClient, {
  ClientProps,
  SignatureParams,
} from './CloudinaryApiClient';
export { SignatureParams, ClientProps };

// import * as utils from "./CloudinaryApiClient";
// export { utils };

export default class CloudinaryPlugin extends Uppy.Plugin {
  apiClient: CloudinaryApiClient;

  constructor(uppy: Uppy.Uppy, options: ClientProps) {
    super(uppy, options);

    const {
      id,
      apiKey,
      cloudName,
      userId,
      folder,
      tags,
      uploadPreset,
      generateSignature,
    } = options;

    this.id = id || 'CloudinaryPlugin';
    this.type = 'uploader';

    this.apiClient = new CloudinaryApiClient({
      apiKey,
      cloudName,
      userId,
      folder,
      tags,
      uploadPreset,
      generateSignature,
    });
  }

  uploadFile = async (fileId: string) => {
    const file = this.uppy.getFile(fileId);

    let uploadStarted = false;

    const response = await this.apiClient.upload(file.data, {
      onUploadProgress: (event: ProgressEvent) => {
        if (!event.lengthComputable) {
          // @ts-ignore
          this.uppy.emit('upload-error', file, 'error');
          return;
        }

        // Inform uppy that the upload has started
        if (!uploadStarted) {
          // @ts-ignore
          this.uppy.emit('upload-started', file);
          uploadStarted = true;
        }

        // Inform Uppy instance of the current progress
        // @ts-ignore
        this.uppy.emit('upload-progress', file, {
          id: fileId,
          uploader: this,
          bytesUploaded: event.loaded,
          bytesTotal: event.total,
        });

        // Inform Uppy that the upload is finished
        // @ts-ignore
      },
    });

    // @ts-ignore
    this.uppy.emit('upload-success', file, response);
  };

  uploadFiles = (fileIDs: string[]): Promise<any> => {
    return Promise.all(
      fileIDs.map(async id => {
        const response = await this.uploadFile(id);

        this.uppy.setFileState(id, {
          response,
        });
      })
    );
  };

  install() {
    this.uppy.addUploader(this.uploadFiles);
  }
  uninstall() {
    this.uppy.removeUploader(this.uploadFiles);
  }
}
