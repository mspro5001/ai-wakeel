const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const logger = require('../../utils/logger');

async function process(params) {
  const { action, inputPath, outputPath, options = {} } = params;
  const videoPath = inputPath || params.videoPath;
  
  if (!videoPath || !require('fs').existsSync(videoPath)) {
    return { success: false, error: 'Video file not found' };
  }
  
  const outputFile = outputPath || path.join(config.paths.videos, `${uuidv4()}.mp4`);
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg(videoPath);
    
    switch (action) {
      case 'cut':
        command = command
          .setStartTime(options.start || '00:00:00')
          .setDuration(options.duration || options.end || '10')
          .output(outputFile);
        break;
      case 'compress':
        command = command
          .videoCodec('libx264')
          .size(options.size || '70%')
          .output(outputFile);
        break;
      case 'add_text':
        const text = options.text || '';
        const drawText = `drawtext=text='${text.replace(/'/g, "'\\\\\\''")}':fontsize=${options.fontSize || 24}:fontcolor=${options.fontColor || 'white'}:x=${options.x || '(w-text_w)/2'}:y=${options.y || 'h-th-50'}`;
        command = command
          .videoCodec('libx264')
          .videoFilters(drawText)
          .output(outputFile);
        break;
      default:
        command = command
          .videoCodec('libx264')
          .output(outputFile);
    }
    
    command
      .on('end', () => {
        logger.info('VideoEditor', `Processed video: ${action}`, { input: videoPath, output: outputFile });
        resolve({ success: true, outputPath: outputFile, action });
      })
      .on('error', (err) => {
        logger.error('VideoEditor', `FFmpeg error: ${err.message}`);
        resolve({ success: false, error: err.message });
      })
      .run();
  });
}

async function merge(params) {
  const { videos = [], outputPath } = params;
  if (!videos.length) return { success: false, error: 'No videos to merge' };
  
  const outputFile = outputPath || path.join(config.paths.videos, `${uuidv4()}-merged.mp4`);
  const fs = require('fs');
  
  // Create temp file list
  const listPath = path.join(config.paths.videos, `${uuidv4()}-list.txt`);
  fs.writeFileSync(listPath, videos.map(v => `file '${v}'`).join('\n'));
  
  return new Promise((resolve) => {
    ffmpeg(listPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .videoCodec('libx264')
      .output(outputFile)
      .on('end', () => {
        fs.unlinkSync(listPath);
        resolve({ success: true, outputPath: outputFile });
      })
      .on('error', (err) => {
        fs.unlinkSync(listPath);
        resolve({ success: false, error: err.message });
      })
      .run();
  });
}

module.exports = { process, merge };
