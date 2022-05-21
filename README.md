# Pose Detection-based Framework for Human Motion Capture for Mechanism Synthesis, Motion Generation, and Visualization
## Installation Instructions
1. Make sure you have Node.js installed. If you do not have Node.js installed, you can download it [here] (https://nodejs.org/en/).
2. Clone or download the respository onto your machine. If you download the zip folder make sure to extract all of its components into a new folder.
3. Open a terminal and change directory to the root folder directory of the repository. Change directories until you are inside the *program* folder.
4. Once you are inside the program folder, type the command *npm install*. Below is an example to help you better understand.  
![image](https://user-images.githubusercontent.com/70245045/169630712-c17a76dd-ef26-4c68-9a8c-1dc6bfc20951.png)
5. Once the insatallation is complete, you can start the application using the command *npm start*. Step 4 is done only once after download.

## Application Overview
This application was developed using React.js and P5.js to capture human movement using a webcam for motion visualization and extraction of task positions for mechanism synthesis problems. Mediapipe's Holistic model is used to detect joint positions for a human user. The App can be used to visualize the raw motion captured and provides
options for filtering through the data using motion design algorithms such as B-Spline Interpolation and B-Spline Approximation. These methods help smoothen the motion
captured to eliminate any noise caused as a result of the model's predicition and low frame rate.  

## Motion Capture Options
A user can choose the type of capture which allows the user to target a specific part of their body of motion tracking. After the user selects a motion capture type, whether to capture the motion in 2D (planar) or 3D (spatial), and checks the start recording checkbox, a green circle pops up on the video in the top right. This circle can be moved around the video frame by mouse click. The center of the circle will shift to where the mouse was clicked. When a user places the tip of their **right hand's index finger** in the green circle for 10 frames a counter will start, counting down 5 seconds. A red circle appears indicating that the recording is in progress and the recording time inseconds appears on the top right. To stop the recording simply play the same tip of your index finger in the red circle region for only 5 frames. Make sure to pull away your finger after the circle turns back green, indicating end of recoridng, to prevent a new recording from started. It is for this reason that the we require the user to keep their finger on the circle of ra longer time to start eht recoridng thatn to stop it. 
# 1. Continuous Motion Capture  
This motion capture option allows for continuous tracking of the right hand during a recording. The right hand can be moved in space and its orientation is represented with a coordinate frame. This type of capture is useful in designing motions with the right hand where positions and orientation are captured and can be used. From this continuous capture, where the position and orientation at every frame are captured, the user can select key positions to apply motion approximation/interpolation algorithms from the Tye of Motion options. Check out this [video] (https://www.youtube.com/watch?v=ChAx5FjYgMM&list=PLIq8Oomy8HEhCFy-FuaNh7p72LjOI_xq-&index=1) for a demonstration of this motion capture.
# 2. Key Postion Capture
This motion capture option is similar to the continuous motion capture except that poses aren't captured in every frame. When a user pauses their hand in space for 4 seconds, then the pose is saved as a key position. Different Type of Motion options can be used to approximate or interpolate between captured key positions to generate smooth motions. Check out this [video] (https://www.youtube.com/watch?v=QvGkoblH8lY&list=PLIq8Oomy8HEhCFy-FuaNh7p72LjOI_xq-&index=3) for a demonstration of this motion capture.
# 3. Joint Motion Capture
This motion capture option allows the user to select joints from the Joint Selection Dialogue in the top right box. Selected joints are tracked in space and their positions are represented with points for visualiztion. The motion capture is continuous, so joint positions are captured for every frame and displayed on the bottom right canvas. Check out this [video] (https://www.youtube.com/watch?v=YZ75_IqqlWU&list=PLIq8Oomy8HEhCFy-FuaNh7p72LjOI_xq-&index=4) for a demonstration of this motion capture.
# 4. Limb Motion Capture
This motion capture option allows the user to select limbs from the Limb Selection Dialogue in the top right box. Selected limbs are tracked in space and their positions/orientations are represented with cylinders for visualiztion. The motion capture is continuous, so limb poses are captured for every frame and displayed on the bottom right canvas. Check out this [video] (https://www.youtube.com/watch?v=QDhiv0Veh_E&list=PLIq8Oomy8HEhCFy-FuaNh7p72LjOI_xq-&index=2) for a demonstration of a sit-to-stand motion capture using this motion cpature.

## Motion Properties
Recorded motion data can be exported as .txt file, where every pose is saved as a quaternion, denoting orientation, and cartesian vector, denoting spatial positon. A user can choose to save the key positions only, to use for a mechanims synthesis problem for example, or save a continuous motion (poses captured in every frame).  
Recorded video and skeleton animation can be downloaded as .webm files.
Both the bottom left and top right canvas (when the moving skeleton is selected) allow for orbit control, meaning a user can rotate the view using their mouse. Upon rotating and zooming in/out, a user can reset the view using the *Reset To Original Position* button.
Text files that included recorded motion can be loaded to extract the motion data and display it in the application.
