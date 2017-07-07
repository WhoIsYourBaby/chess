using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using LitJson;


enum EnumGoldChoose
{
	gc100,
	gc200,
	gc500,
	gc1000,
	gc2000
}

public class BrnnRoomController : MonoBehaviour {

	EnumGoldChoose goldIndex;	//选中的金币额度索引100~2000

	int goldOnPk1;
	int goldOnPk2;
	int goldOnPk3;
	int goldOnPk4;

	//iboutlet
	public GameObject buttonExit;

	public GameObject panelPkChoose1;
	public GameObject textMyChip1;
	public GameObject textTotalChip1;

	public GameObject panelPkChoose2;
	public GameObject textMyChip2;
	public GameObject textTotalChip2;

	public GameObject panelPkChoose3;
	public GameObject textMyChip3;
	public GameObject textTotalChip3;

	public GameObject panelPkChoose4;
	public GameObject textMyChip4;
	public GameObject textTotalChip4;

	public GameObject buttonGoldChoose1;
	public GameObject buttonGoldChoose2;
	public GameObject buttonGoldChoose3;
	public GameObject buttonGoldChoose4;
	public GameObject buttonGoldChoose5;


	// Use this for initialization
	void Start () {
		//init
		goldIndex = EnumGoldChoose.gc2000;
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
			resetUIState();
		});

		initEvent ();
		resetUIState ();
	}

	// Update is called once per frame
	void Update () {
		PomeloSingleton.CreateInstance ().updatePerFrame ();
	}

	//reset state
	void resetUIState () {
		goldOnPk1 = 0;
		goldOnPk2 = 0;
		goldOnPk3 = 0;
		goldOnPk4 = 0;
	}

	void resetGoldButtonSelect () {
		switch (this.goldIndex) {
		case(EnumGoldChoose.gc100):
			buttonGoldChoose1.GetComponent<Button> ().Select ();
			break;
		case(EnumGoldChoose.gc200):
			buttonGoldChoose2.GetComponent<Button> ().Select ();
			break;
		case(EnumGoldChoose.gc500):
			buttonGoldChoose3.GetComponent<Button> ().Select ();
			break;
		case(EnumGoldChoose.gc1000):
			buttonGoldChoose4.GetComponent<Button> ().Select ();
			break;
		case(EnumGoldChoose.gc2000):
			buttonGoldChoose5.GetComponent<Button> ().Select ();
			break;
		default:
			buttonGoldChoose5.GetComponent<Button> ().Select ();
			break;
		}
	}

	void initEvent () {
		Button tmpBtn = buttonExit.GetComponent<Button>();
		tmpBtn.onClick.AddListener (exitRoom);

		tmpBtn = panelPkChoose1.GetComponentInChildren<Button>();
		tmpBtn.onClick.AddListener (chipInPk1Choose);

		tmpBtn = panelPkChoose2.GetComponentInChildren<Button>();
		tmpBtn.onClick.AddListener (chipInPk1Choose);

		tmpBtn = panelPkChoose3.GetComponentInChildren<Button>();
		tmpBtn.onClick.AddListener (chipInPk1Choose);

		tmpBtn = panelPkChoose4.GetComponentInChildren<Button>();
		tmpBtn.onClick.AddListener (chipInPk1Choose);

		//gold choose
		tmpBtn = buttonGoldChoose1.GetComponent<Button> ();
		tmpBtn.onClick.AddListener (chipInGold1Choose);

		tmpBtn = buttonGoldChoose2.GetComponent<Button> ();
		tmpBtn.onClick.AddListener (chipInGold2Choose);

		tmpBtn = buttonGoldChoose3.GetComponent<Button> ();
		tmpBtn.onClick.AddListener (chipInGold3Choose);

		tmpBtn = buttonGoldChoose4.GetComponent<Button> ();
		tmpBtn.onClick.AddListener (chipInGold4Choose);

		tmpBtn = buttonGoldChoose5.GetComponent<Button> ();
		tmpBtn.onClick.AddListener (chipInGold5Choose);
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
				MResponse res = new MResponse (obj);
				if (res.isOk()) {
					JsonData data = res.data;
					Debug.Log(data.ToJson());

					updatePokerBannerGoldWithData(data);
				}
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

	//选择金币
	public void chipInGold1Choose() {
		this.goldIndex = EnumGoldChoose.gc100;	//100
	}

	public void chipInGold2Choose() {
		this.goldIndex = EnumGoldChoose.gc200;	//200
	}

	public void chipInGold3Choose() {
		this.goldIndex = EnumGoldChoose.gc500;	//500
	}

	public void chipInGold4Choose() {
		this.goldIndex = EnumGoldChoose.gc1000;	//1000
	}

	public void chipInGold5Choose() {
		this.goldIndex = EnumGoldChoose.gc2000;	//2000
	}

	int goldOnIndex(EnumGoldChoose gc) {
		switch (gc) {
		case(EnumGoldChoose.gc100):
			return 100;
		case(EnumGoldChoose.gc200):
			return 200;
		case(EnumGoldChoose.gc500):
			return 500;
		case(EnumGoldChoose.gc1000):
			return 1000;
		case(EnumGoldChoose.gc2000):
			return 2000;
		default:
			return 2000;
		}
	}

	//更新用户下注的金额
	//data为空的时候统统值为0
	void updatePokerBannerGoldWithData (JsonData data) {
		if (data == null) {
			
		} else {
			int p1 = (int)data["1"];
			textMyChip1.GetComponent<Text>().text = p1.ToString();

			int p2 = (int)data["2"];
			textMyChip1.GetComponent<Text>().text = p2.ToString();

			int p3 = (int)data["3"];
			textMyChip1.GetComponent<Text>().text = p3.ToString();

			int p4 = (int)data["4"];
			textMyChip1.GetComponent<Text>().text = p4.ToString();
		}
	}
}
