using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class HomeController : MonoBehaviour {

	public GameObject testPoker;

	// Use this for initialization
	void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
		PomeloSingleton.CreateInstance ().updatePerFrame ();
	}

	public void playBrnn () {
		PomeloSingleton.CreateInstance ().connectToConnector (delegate {
			string token = PomeloSingleton.CreateInstance ().getToken();
			pp.connector.entryHandler.enterRoom (token, "brnn", null,
				delegate(LitJson.JsonData obj) {
					SceneManager.LoadScene("BrnnRoom");
				});
		});
	}

	public void moveButtonAction () {
		PokerItem pokeritem = testPoker.GetComponent<PokerItem> ();
		pokeritem.runMoveAnimationTo (new Vector2(-300, 400), delegate {
			Debug.Log("Move over!!!!!!!!");
		});
	}

	public void flipButtonAction () {
		PokerItem pokeritem = testPoker.GetComponent<PokerItem> ();
		pokeritem.runFlipAnimation (true);
	}
}
