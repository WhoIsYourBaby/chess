using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using LitJson;

public class MBrnnPokerRes {
	public ArrayList pokerGroup;
	public ArrayList resultList;

	public MBrnnPokerRes (JsonData pokerRes) {
		if (pokerRes.IsArray == false) {
			Debug.Log ("pokerRes is not array");
			return;
		}

		pokerGroup = new ArrayList ();
		resultList = new ArrayList ();
		for (int i = 0; i < pokerRes.Count; i++) {
			JsonData data = pokerRes [i];
			JsonData pokerJson = data ["poker"];	//array
			JsonData result = data ["result"];	//dic
			resultList.Add(result);
			ArrayList pokerList = new ArrayList ();
			for (int j = 0; j < pokerJson.Count; j++) {
				JsonData pokerItemJson = pokerJson[j];
				Debug.Log (pokerItemJson.ToJson());
				int value = (int)pokerItemJson ["value"];
				string colorString = (string)pokerItemJson ["color"];
				char color = colorString.ToCharArray () [0];
				MPoker pokerModel = new MPoker (value, color);
				pokerList.Add (pokerModel);
			}
			pokerGroup.Add (pokerList);
		}
		Debug.Log("abc");
	}
}
