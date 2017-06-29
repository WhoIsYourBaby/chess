using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class HomeController : MonoBehaviour {

	// Use this for initialization
	void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
		PomeloSingleton.CreateInstance ().updatePerFrame ();
	}

	public void playBrnn () {
		PomeloSingleton pml = PomeloSingleton.CreateInstance ();
	}
}
