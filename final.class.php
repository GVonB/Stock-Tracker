<?php 
class final_rest
{



/**
 * @api  /api/v1/setTemp/
 * @apiName setTemp
 * @apiDescription Add remote temperature measurement
 *
 * @apiParam {string} location
 * @apiParam {String} sensor
 * @apiParam {double} value
 *
 * @apiSuccess {Integer} status
 * @apiSuccess {string} message
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":0,
 *              "message": ""
 *     }
 *
 * @apiError Invalid data types
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":1,
 *              "message":"Error Message"
 *     }
 *
 */
	public static function setTemp ($location, $sensor, $value) {
		if (!is_numeric($value)) {
			$retData["status"]=1;
			$retData["message"]="'$value' is not numeric";
		}
		else {
			try {
				EXEC_SQL("insert into temperature (location, sensor, value, date) values (?,?,?,CURRENT_TIMESTAMP)",$location, $sensor, $value);
				$retData["status"]=0;
				$retData["message"]="insert of '$value' for location: '$location' and sensor '$sensor' accepted";
			}
			catch  (Exception $e) {
				$retData["status"]=1;
				$retData["message"]=$e->getMessage();
			}
		}

		return json_encode ($retData);
	}

	public static function signUP ($name, $username, $password) {
		try {
			$EXIST=GET_SQL("select * from user where username=?", $username);
			if (count($EXIST) > 0) {
				$retData["status"]=1;
				$retData["message"]= "User $username exists";
			}
			else {
				EXEC_SQL("insert into user (name, username, password) values(?,?,?)",$name,$username, password_hash($password, PASSWORD_DEFAULT));
				$retData["status"]=0;
				$retData["message"]= "User $username Inserted";
			}
		}
		catch  (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		return json_encode ($retData);
	}

	public static function login ($username, $password) {
		try {
			$USER=GET_SQL("select * from user where username=?", $username);
			if (count($USER) == 1) {
				if (password_verify($password, $USER[0]["password"])) {
					$id = session_create_id();
					EXEC_SQL("update user set session=?, expiration= DATETIME(CURRENT_TIMESTAMP, '+30 minutes') where username=?", $id, $username);
					$retData["status"]=0;
					$retData["session"]=$id;
					$retData["message"]= "User '$username' logged in";
				}
				else {
							$retData["status"]=1;
							$retData["message"]= "User/Password Not Found";
						}
				}
			else {
				$retData["status"]=1;
				$retData["message"]= "User/Password Not Found";
			}
		}
		catch  (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		return json_encode ($retData);
	}

	public static function logout ($username, $session) {
		try {
			$USER=GET_SQL("select * from user where username=? and session=? ",$username,$session);
			// GET_SQL returns a list of returned records
			// Each array element is an array of selected fields with column names as key
			if (count($USER) == 1) { // Check if record returned  
				EXEC_SQL("update user set session=null, expiration= null where username=?", $username);
				$retData["status"]=0;
				$retData["message"]= "User '$username' logged out";
			}
			else {
				$retData["status"]=1;
				$retData["message"]= "User Not Found";
			}
		} catch  (Exception $e) {
			$retData["status"]=1;
			$retData["message"]=$e->getMessage();
		}
		return json_encode ($retData);
	}
}
