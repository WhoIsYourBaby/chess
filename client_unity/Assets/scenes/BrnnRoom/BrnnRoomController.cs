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


enum EnumGameState {
	Ready	= 0,	//准备、下注时间
	Poker	= 1,	//发牌时间
	Other	= 2	//空闲时间
}

public class BrnnRoomController : MonoBehaviour {

	EnumGoldChoose goldIndex;	//选中的金币额度索引100~2000

	int goldOnPk1;
	int goldOnPk2;
	int goldOnPk3;
	int goldOnPk4;

	EnumGameState state;

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

	//state iboutlet
	public GameObject imageState;
	public GameObject imageTime0;
	public GameObject imageTime1;


	// Use this for initialization
	void Start () {
		pp.observer.brnn.onAdd (delegate(LitJson.JsonData obj) {
			//提示用户加入房间
		});

		pp.observer.brnn.onLeave (delegate(LitJson.JsonData obj) {
			//用户离开了房间
		});

		pp.observer.brnn.onWillStart (delegate(LitJson.JsonData obj) {
			//下注时间倒计时
			MResponse res = new MResponse(obj);
			if (res.isOk()) {
				int stateInt = (int)res.data["state"];
				this.state = (EnumGameState)stateInt;
				int time = (int)res.data["time"];
				updateStateUI(time);
			}
		});

		pp.observer.brnn.onDealPoker (delegate(LitJson.JsonData obj) {
			//发牌
			this.state = EnumGameState.Poker;
			updateStateUI(-1);
		});

		pp.observer.brnn.onGoldResult (delegate(LitJson.JsonData obj) {
			//计算输赢结果
			this.state = EnumGameState.Other;
			updateStateUI(-1);
			readyForPlay();
		});

		goldIndex = EnumGoldChoose.gc2000;
		initEvent ();
		readyForPlay ();
	}

	// Update is called once per frame
	void Update () {
		PomeloSingleton.CreateInstance ().updatePerFrame ();
	}

	//reset state
	void readyForPlay () {
		//data init
		goldOnPk1 = 0;
		goldOnPk2 = 0;
		goldOnPk3 = 0;
		goldOnPk4 = 0;
		state = EnumGameState.Other;

		updatePokerBannerGoldWithData (null);
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

	//给按钮添加点击事件
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
		if (this.state != EnumGameState.Ready) {
			//下注时间已过
			Debug.Log("下注时间已过");
			return;
		}
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
			textMyChip1.GetComponent<Text>().text = "0";
			textMyChip2.GetComponent<Text>().text = "0";
			textMyChip3.GetComponent<Text>().text = "0";
			textMyChip4.GetComponent<Text>().text = "0";

			textTotalChip1.GetComponent<Text>().text = "0";
			textTotalChip2.GetComponent<Text>().text = "0";
			textTotalChip3.GetComponent<Text>().text = "0";
			textTotalChip4.GetComponent<Text>().text = "0";
		} else {
			if (data.ContainsKey("1")) {
				int p1 = (int)data["1"];
				textMyChip1.GetComponent<Text>().text = p1.ToString();
			}

			if (data.ContainsKey("2")) {
				int p2 = (int)data["2"];
				textMyChip2.GetComponent<Text>().text = p2.ToString();
			}

			if (data.ContainsKey("3")) {
				int p3 = (int)data["3"];
				textMyChip3.GetComponent<Text>().text = p3.ToString();
			}

			if (data.ContainsKey("4")) {
				int p4 = (int)data["4"];
				textMyChip4.GetComponent<Text>().text = p4.ToString();
			}
		}
	}

	//update state
	//time < 0 的时候隐藏imagetime
	void updateStateUI (int time) {
		//1 setup time
		this.imageTime0.SetActive (time >= 0);
		this.imageTime1.SetActive (time >= 0);

		string timeString = time.ToString ();
		if (timeString.Length > 1) {
			char[] arr = timeString.ToCharArray ();
			char time0 = arr [0];
			char time1 = arr [1];

			string time0SpriName = string.Format ("po9_n_{0}", time0.ToString());
			Sprite time0Spri = GameConfig.loadResourceSpriteInSheet ("po9_n", time0SpriName);
			imageTime0.GetComponent<Image> ().sprite = time0Spri;

			string time1SpriName = string.Format ("po9_n_{0}", time1.ToString());
			Sprite time1Spri = GameConfig.loadResourceSpriteInSheet ("po9_n", time1SpriName);
			imageTime1.GetComponent<Image> ().sprite = time1Spri;
		} else {
			char[] arr = timeString.ToCharArray ();
			char time0 = '0';
			char time1 = arr [0];

			string time0SpriName = string.Format ("po9_n_{0}", time0.ToString());
			Sprite time0Spri = GameConfig.loadResourceSpriteInSheet ("po9_n", time0SpriName);
			imageTime0.GetComponent<Image> ().sprite = time0Spri;

			string time1SpriName = string.Format ("po9_n_{0}", time1.ToString());
			Sprite time1Spri = GameConfig.loadResourceSpriteInSheet ("po9_n", time1SpriName);
			imageTime1.GetComponent<Image> ().sprite = time1Spri;
		}

		//2 setup state
		string stateImageName = stateImageNameWithState(this.state);
		Sprite spriteState = Resources.Load<Sprite> (stateImageName);
		imageState.GetComponent<Image>().sprite = spriteState;
	}

	string stateImageNameWithState (EnumGameState state) {
		switch (state) {
		case EnumGameState.Ready:
			return "longhu21_n";
		case EnumGameState.Poker:
			return "longhu22_n";
		case EnumGameState.Other:
			return "longhu23_n";
		default:
			return "longhu23_n";
		}
	}
}
