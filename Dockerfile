# Use an official Node.js runtime image as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json, package-lock.json, and tailwind.config.js
COPY package*.json ./
COPY tailwind.config.js ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend application files into the container
COPY . .

# Expose the port that the frontend will run on
EXPOSE 3000

# Command to start your frontend application using npm start
CMD ["npm", "start"]
