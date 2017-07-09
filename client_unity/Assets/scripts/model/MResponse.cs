using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using LitJson;

public class MResponse {
	public int code;
	public string msg;
	public JsonData data;

	public MResponse(JsonData resJson) {
		code = (int)resJson ["code"];
		msg = (string)resJson ["msg"];
		if (resJson.ContainsKey("data")) {
			data = resJson ["data"];
		}
	}

	public bool isOk () {
		return code > 0;
	}
}
