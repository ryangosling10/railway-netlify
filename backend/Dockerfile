# Use Node.js base image with Debian
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Install Python, pip, yt-dlp, and ffmpeg
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg && \
    pip3 install yt-dlp

# Copy app files
COPY . .

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
