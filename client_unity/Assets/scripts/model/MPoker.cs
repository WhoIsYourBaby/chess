using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MPoker {
	int value;
	char color;
	public MPoker (int v, char c) {
		value = v;
		color = c;
	}

	//前面
	public Sprite getFrontSprite() {
		string filename = string.Format ("png/{0}{1}", value, color);
		Sprite spri = Resources.Load<Sprite> (filename);
		return spri;
	}

	//后面
	public Sprite getBackendSprite() {
		string filename = string.Format ("png/bai20_n");
		Sprite spri = Resources.Load<Sprite> (filename);
		return spri;
	}

	public GameObject createPokerItem (GameObject prefab) {
		GameObject pokerObj = GameObject.Instantiate<GameObject> (prefab);
		pokerObj.GetComponent<PokerItem> ().pokerModel = this;
		pokerObj.GetComponent<RectTransform> ().localScale = new Vector3 (0,0,0);
		pokerObj.GetComponent<RectTransform> ().pivot = new Vector2 (0.5f, 0.5f);
		pokerObj.GetComponent<RectTransform> ().anchorMin = new Vector2 (0.5f,0.5f);
		pokerObj.GetComponent<RectTransform> ().anchorMax = new Vector2 (0.5f,0.5f);
		pokerObj.GetComponent<RectTransform> ().anchoredPosition3D = new Vector3 (0,0,0);

		return pokerObj;
	}
}
