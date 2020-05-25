DOCS for twitter-clone-firebase-backend
==========================================
This is not open API
-----------------------

Endpoints
============

-----USERS ROUTE-----
------------------------
### POST '/signup' Public Router, Media type: application/json
#### REQUEST (Required fields) 
* **email** ***string*** (valid confirmed user email address, which used during registration)
* **password** ***string*** (valid confirmed user password, which used during registration)
* **confirmPassword** ***string*** (valid confirmed user password, which match with password)
* **handle** ***string*** (valid unique user nickname, which used in application)
#### RESPONSE Media type: application/json
##### If object is valid return valid json object
* **mainToken** ***string*** (unique user token, which used in Private routes)
##### If object is not valid return json object with error fields
* **email** ***string*** (if email is not valid return error message)
* **password** ***string*** (if password is not valid return error message)
* **confirmPassword** ***string*** (if confirmPassword is not match with password or not valid return error message)
* **handle** ***string*** (if handle is already used or not valid return error message)
##### If happened internal server error return json object with genral error field
* **general** ***string*** (Error from server with 500 status code)

### POST '/login' Public Router, Media type: application/json
#### REQUEST (Required fields) 
* **email** ***string*** (valid confirmed user email address, which used during registration)
* **password** ***string*** (valid confirmed user password, which used during registration)
#### RESPONSE Media type: application/json
##### If object is valid return valid json object
* **mainToken** ***string*** (unique user token, which used in Private routes)
##### If object is not valid return json object with error fields
* **email** ***string*** (if email is not valid return error message)
* **password** ***string*** (if password is not valid return error message)
##### If happened internal server error return json object with genral error field
* **general** ***string*** (Error from server with 500 status code)

