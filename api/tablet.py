import asyncio
import websockets

async def listen_for_messages():
    uri = "ws://localhost:8000/ws/tablet" # Replace with your server URI
    # Use the connection as an asynchronous context manager
    async with websockets.connect(uri) as websocket:
        print("Connection established. Listening for messages...")
        # Iterate over incoming messages
        async for message in websocket:
            print(f"Received message: {message}")
            # You can process the message and optionally send a response
            # await websocket.send("Message received") 

# Run the client
if __name__ == "__main__":
    try:
        asyncio.run(listen_for_messages())
    except KeyboardInterrupt:
        print("Client disconnected.")
