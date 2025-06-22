# Use Node.js LTS image
FROM node:18

# Install yt-dlp and ffmpeg
RUN apt-get update && \
    apt-get install -y python3-pip ffmpeg && \
    pip3 install yt-dlp

# Set working directory
WORKDIR /app

# Copy all files to container
COPY . .

# Install npm dependencies
RUN npm install

# Expose the backend port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
