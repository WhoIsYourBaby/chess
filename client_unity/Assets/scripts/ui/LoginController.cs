using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class LoginController : MonoBehaviour {

	void Start() {
		PomeloSingleton pml = PomeloSingleton.CreateInstance ();
		if (pml.getToken() == null || pml.getToken().Length == 0) {
			return;
		}
		pml.refreshToken (delegate {
			Debug.Log("resfresh token over");
			SceneManager.LoadScene("Home");
		});
	}

	void Update() {
		PomeloSingleton.CreateInstance ().updatePerFrame ();
	}

	public void guestLogin() {
		PomeloSingleton pml = PomeloSingleton.CreateInstance ();
		pml.guestLogin(delegate {
			SceneManager.LoadScene("Home");
		});
	}
}
