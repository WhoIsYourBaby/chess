using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class LoginController : MonoBehaviour {

	void Start() 
	{
		PomeloSingleton pml = PomeloSingleton.CreateInstance ();
		if (pml.getToken() == null) {
			pml.refreshToken (delegate {
				SceneManager.LoadScene("Home");
			});
		}
	}

	void Update()
	{
		PomeloSingleton.CreateInstance ().updatePerFrame ();
	}

	public void guestLogin() {
		PomeloSingleton pml = PomeloSingleton.CreateInstance ();
		pml.guestLogin(delegate {
			SceneManager.LoadScene("Home");
		});
	}
}
