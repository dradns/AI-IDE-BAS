# Use the provided base image
FROM docker.litellm.ai/berriai/litellm:main-latest

# Set the working directory to /app
WORKDIR /app

# Copy the configuration file into the container at /app
COPY config.yaml .

# Copy the guardrail file into the container at /app
COPY custom_presidio_guardrail.py .

# Make sure your docker/entrypoint.sh is executable
RUN chmod +x ./docker/entrypoint.sh

# Expose the necessary port
EXPOSE 4000/tcp

# Override the CMD instruction with your desired command and arguments
# Use --detailed_debug for verbose logs 

CMD ["--port", "4000", "--config", "config.yaml"]
