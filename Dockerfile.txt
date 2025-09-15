# Start from the official Node.js 18 image
FROM node:18

# Install ImageMagick
RUN apt-get update && apt-get install -y imagemagick

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (better caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your app's code
COPY . .

# Expose the port your app listens on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]