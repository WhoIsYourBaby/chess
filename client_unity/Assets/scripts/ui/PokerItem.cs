using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class PokerItem : MonoBehaviour {

	public Vector2 desPosition;	//目的位置
	public bool isMoving = false;		//是否允许移动
	public MPoker pokerModel;

	//移动到指定位置后的回调
	System.Action moveOverCallback;

	// Use this for initialization
	void Start () {
		desPosition = Vector2.zero;
		moveOverCallback = null;
		pokerModel = null;
	}
	
	// Update is called once per frame
	void Update () {
	}

	void OnGUI () {
		if (isMoving == true) {
			Debug.Log ("OnGUIOnGUIOnGUIOnGUI");
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

	//翻转到一半的时候回调
	public void flipHalf() {
		if (pokerModel != null) {
			gameObject.GetComponent<Image> ().sprite = pokerModel.getSprite ();
		}
	}

	public void runMoveAnimationTo (Vector2 pos, System.Action callback) {
		this.desPosition = pos;
		this.isMoving = true;
		this.moveOverCallback = callback;
	}


	public void runFlipAnimation (bool toFront) {
		this.gameObject.GetComponent<Animator> ().Play ("Flip", -1, 0f);
	}

	public IEnumerator runMoveAnimationDelayTo (float delay, Vector2 pos, System.Action callback) {
		yield return WaitForSeconds (delay);
		this.desPosition = pos;
		this.isMoving = true;
		this.moveOverCallback = callback;
	}
}
