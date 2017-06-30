using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class BrnnRoomController : MonoBehaviour {

	// Use this for initialization
	void Start () {
		pp.observer.brnn.onAdd (delegate(LitJson.JsonData obj) {
			//提示用户加入房间
		});

		pp.observer.brnn.onLeave (delegate(LitJson.JsonData obj) {
			//用户离开了放假
		});

		pp.observer.brnn.onWillStart (delegate(LitJson.JsonData obj) {
			//下注时间倒计时
		});

		pp.observer.brnn.onDealPoker (delegate(LitJson.JsonData obj) {
			//发牌
		});

		pp.observer.brnn.onGoldResult (delegate(LitJson.JsonData obj) {
			//计算输赢结果
		});
	}
	
	// Update is called once per frame
	void Update () {
		
	}


	public void exitRoom() {
		pp.connector.entryHandler.exit (delegate(LitJson.JsonData obj) {
			//退出当前房间
		});
	}


	public void chipIn(){
		MUserInfo userinfo = PomeloSingleton.CreateInstance ().userinfoModel;
		pp.brnn.brnnHandler.chipIn (userinfo.userid, 2000, 1, 
		delegate(LitJson.JsonData obj) {
				//下注
		});
	}
}
