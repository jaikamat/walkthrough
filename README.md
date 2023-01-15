game loop rate limiting
server side -
always listening, when it recieves a data packet, store the information
every (1000/30fps ms), send the information to the clients

client side-
rendering loop can freewheel and run at whatever speed
next_tick=current_time + (1000/physics fps)
if current_time > next_tick....
send the current location and current motion speed (delta x and delta y)

two options - client should always listen for input from server and apply it immediately, or cache the input and process it during the physics tick time.

to update the other player location every frame, you can do this:
player location = last_received_location + (motion vector \* percentage of a second past since last physics frame received)

the idea being that if you transmit the motion vector as units per second, you can figure out
what percentage of a second has past between the last time data was received and the current time, and add that fraction to the
location. This decouples everything basically, and means you can change the physics frame rate to whatever you want, or even handle lost packets.

example-
if the other player is moving at say 1000 units per second, and the server says the user is at position 0, then for every millisecond since you recieved that data, you have 1 unit of motion. so 10 ms later, tehy've moved 10, 100 ms later they've moved 100.

(then, when you receive the next frame of information from the server, you update the location. if your physics fps rate from the server is too low, you'll see them jerking around)

to handle the motion inputs for the game:
option 1 - don't update your local player speed except at the physics tick rate (server tick rate). could feel laggy
option 2 - update your local player motion/speed at maximum frame rate. probably fine.

anyway, for your character you set the motion vector to the speed/direction that you chose from the inputs.
if you do something like this, you can smooth your motion a little bit:

if (keydown) then desired_speed = max_units_per_second;
if (no keys down) then desired_speed = 0;
real_speed = current speed + ((current speed - desired speed) / magic number)
(magic number being some number you choose which controls how rapidly your speed matches the desired speed.
if you set it really high, it will feel like you're on ice. if you set it really low it'll be abrupt. Somewhere in the middle will make you feel a little weighty)
