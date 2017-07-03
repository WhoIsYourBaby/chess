using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class BrnnRoomController : MonoBehaviour {

	int goldIndex;	//选中的金币额度索引100~2000

	int goldOnPk1;
	int goldOnPk2;
	int goldOnPk3;
	int goldOnPk4;

	// Use this for initialization
	void Start () {
		//init
		goldIndex = 4;
		goldOnPk1 = 0;
		goldOnPk2 = 0;
		goldOnPk3 = 0;
		goldOnPk4 = 0;

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
			SceneManager.LoadScene("Home");
		});
	}


	public void chipIn(int gold, int pkindex){
		MUserInfo userinfo = PomeloSingleton.CreateInstance ().userinfoModel;
		pp.brnn.brnnHandler.chipIn (userinfo.userid, gold, pkindex, 
		delegate(LitJson.JsonData obj) {
				//下注成功后服务器将返回用户的下注情况
		});
	}


	//选择下注牌
	public void chipInPk1Choose() {
		int gold = goldOnIndex (this.goldIndex);
		goldOnPk1 += gold;
		chipIn (goldOnPk1, 1);
	}

	public void chipInPk2Choose() {
		int gold = goldOnIndex (this.goldIndex);
		goldOnPk2 += gold;
		chipIn (goldOnPk2, 2);
	}

	public void chipInPk3Choose() {
		int gold = goldOnIndex (this.goldIndex);
		goldOnPk3 += gold;
		chipIn (goldOnPk3, 3);
	}

	public void chipInPk4Choose() {
		int gold = goldOnIndex (this.goldIndex);
		goldOnPk4 += gold;
		chipIn (goldOnPk4, 4);
	}

	//选择金币,重复选择累加下注
	public void chipInGold1Choose() {
		this.goldIndex = 0;	//100
	}

	public void chipInGold2Choose() {
		this.goldIndex = 1;	//200
	}

	public void chipInGold3Choose() {
		this.goldIndex = 2;	//500
	}

	public void chipInGold4Choose() {
		this.goldIndex = 3;	//1000
	}

	public void chipInGold5Choose() {
		this.goldIndex = 4;	//2000
	}

	int goldOnIndex(int index) {
		switch (index) {
		case(0):
			return 100;
		case(1):
			return 200;
		case(2):
			return 500;
		case(3):
			return 1000;
		case(4):
			return 2000;
		default:
			return 2000;
		}
	}

}
