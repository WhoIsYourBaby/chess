using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PokerItem : MonoBehaviour {

	public Vector2 desPosition;
	public bool isMoving;

	System.Action moveOverCallback;

	// Use this for initialization
	void Start () {
		desPosition = Vector2.zero;
		isMoving = false;
		moveOverCallback = null;
	}
	
	// Update is called once per frame
	void Update () {
	}

	void OnGUI () {
		if (isMoving) {
			if (this.gameObject.GetComponent<RectTransform> ().anchoredPosition != desPosition) {
				Debug.Log ("Moveing....");
				float step = 500 * Time.deltaTime;
				Debug.Log (this.gameObject.GetComponent<RectTransform> ().anchoredPosition);
				this.gameObject.GetComponent<RectTransform> ().anchoredPosition = Vector2.MoveTowards (this.gameObject.GetComponent<RectTransform> ().anchoredPosition, desPosition, step);
			} else {
				isMoving = false;
				if (this.moveOverCallback != null) {
					this.moveOverCallback ();
				}
			}
		}
	}

	//移动完成后回调
	public void moveOver(){
		Debug.Log ("move over");
	}

	//翻转到一半的时候回调
	public void flipHalf() {
		Debug.Log ("flip hafl");
	}

	public void runMoveAnimationTo (Vector2 pos, System.Action callback) {
		this.desPosition = pos;
		this.isMoving = true;
		this.moveOverCallback = callback;
	}


	public void runFlipAnimation (bool toFront) {
		this.gameObject.GetComponent<Animator> ().Play ("Flip", -1, 0f);
	}
}
