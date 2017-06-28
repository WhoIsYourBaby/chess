using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class LoginController : MonoBehaviour {

	void Start() 
	{
	}

	void Update()
	{
		PomeloSingleton.CreateInstance ().updatePerFrame ();
	}

	public void guestLogin() {
		PomeloSingleton pml = PomeloSingleton.CreateInstance ();
		pml.connectGate ();
	}
}
