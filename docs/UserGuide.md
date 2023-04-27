# User Guide

**Before Continuing with this User Guide, please make sure you have deployed the frontend and backend stacks, as well as any sensors you may have.**

  [Deployment Guides](./DeploymentGuide.md)

| Index                                                                                        | Description                                               |
|:---------------------------------------------------------------------------------------------|:----------------------------------------------------------| 
| [Sign In](#Sign-In)          | Sign in to a care provider account              |
| [Dashboard Home](#Dashboard-Home)                                                            | How to see all patients overview                            |
| [Patient Details](#Patient-Details)                                                                    | See details for a patient                                         |
| [Test Event Details](#Test-Event-Details)  | See details for a test event                        |
| [Add User to CareProvider Group](#Add-User-to-CareProvider-Group)  | Grant user permission to the dashboard                        |


## Sign In Or Create An Account

You can create an account using your email address. Enter your preferred password, confirm password, then enter your first and last name.
![alt text](./images/user_guide/signup.PNG)


After deploying both the frontend and backend stacks, you will see this login page after clicking the generated Amplify link. 
![alt text](./images/user_guide/signin.PNG)


After filling out the information, click on the "Sign In" button. 

Note: right after you create an account or if you created an account not too long ago, you may see the error below. In this case, ask your admin to give you permissions by following the #Test-Event-Details section


HOME

The home page only displays the list of patients assigned to you. 
![alt text](./images/user_guide/home.PNG)


To search for a patient, type their name in the Search for Patient Name search bar. Clicking on the ‘arrow’ symbol will also open a drop down with the list of patients, organized by last names. 
![alt text](./images/user_guide/search_patients.PNG)


Click on the patient name you would like to view, and click the ‘search’ button to initiate the search function. To clear the search and view all patients, click on the ‘Show All Patients’ button.
![alt text](./images/user_guide/home.PNG)


To add patients, click on the ‘Add Patient’ button. This will open a pop-up that allows you to manually add a patient or find one that is registered in the database.
![alt text](./images/user_guide/search_careprovider_patients.png)


Clicking on the ‘Manually Add New Patient’ will open a pop up that requires you to fill out their first and last name. To add the patient, click on ‘Add New Patient’.
![alt text](./images/user_guide/add_manual_patient.PNG)

To add patients that are registered in the database, type their name on the Patient Name search box. Clicking on the ‘arrow’ symbol will also open a drop down menu with the patients’ names and IDs. 
![alt text](./images/user_guide/search_patients.PNG)
Click on the patient you want to add, and click ‘Add Selected Patient’.
![alt text](./images/user_guide/add_manual_patient.PNG)


To assign a test to the patient, click on the ‘Manage’ button.
<!-- ![alt text](./images/user_guide/) -->



To select the movement you want to assign, click the checkbox next to the movement name and click ‘Save’.
[assign test 02]


## Patient Details

To view a patient’s record, click on the ‘See Patient’ button. This will open a new page displaying test records of that patient. On the top of the page, you can view the weekly and monthly average, and how it changes over time. It also shows a graph that plots the patient test scores over a designated period of time. To change the time range, simply click on the button and select the date you prefer. 
![alt text](./images/user_guide/patient_details.PNG)

In the score graph, the  y-axis of the graph represents the scores from 0-100 and the x-axis of the graph represents the datesTo download the score tracking graph, click on the ‘Download Graph’ button. A PDF file will be saved on your computer.
![alt text](./images/user_guide/score_graph.PNG)

If you scroll down, you can view the patient's measurement range over time. Clicking on the ‘arrow’ symbol will open a drop down menu for you to select a specific IMU range graph.
![alt text](./images/user_guide/range_graph.PNG)



The IMU data range graph displays the raw IMU data that was sent from the mobile app. It displays the range between the maximum and minimum values for each sensor component and each axis, such as accelerometer x-axis values, accelerometer y-axis values, and accelerometer z-axis values.
![alt text](./images/user_guide/score_and_range_graphs.PNG)

The y-axis of the IMU range graph represents the values for each sensor component:
accelerometer displays acceleration, gyroscope displays angular velocity, magnetometer displays magnetic field values. The x-axis of the range graph represents the date and time of the recordings
![alt text](./images/user_guide/range_graph.PNG)


To download the IMU range graph, click on the ‘hamburger’ button on the right hand side. You can choose to download the graph as a single SVG, PNG, or CSV file.
[range graph download]







The patient data page also shows the patient’s past test events, including their balance score, the type of movement, date when it was completed, and any notes saved. 
![alt text](./images/user_guide/events_table.PNG)

To 

To delete a past test event, click on the checkbox beside the test you would like to delete and click on the ‘Delete’ button.
[delete test 01]



Clicking on the ‘Delete’ button will open a pop-up to confirm your choice.
[delete test 02]

## Test Details

To view a test event in the test event table. Click the test in the table and it will take you to the following page. It shows you the name of the patient, the test type, balance score, timestamp, and any notes left by the doctor or patient:
![alt text](./images/user_guide/test_event_details.PNG)

If you wish to save this information, click download. It will download the raw recordings as a csv, and the full details as a pdf file:
![alt text](./images/user_guide/browser_download.PNG)

Below show the content of the files downloaded:
pdf:
![alt text](./images/user_guide/download_pdf.PNG)

csv:
![alt text](./images/user_guide/download_csv.PNG)
