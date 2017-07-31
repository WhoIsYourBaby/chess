using UnityEngine;
using System.Collections;
using Proto;
using Proto.connector;
using Proto.chat;
using System;

public class logicclient : MonoBehaviour
{
    public UnityEngine.UI.Text text;
    public UnityEngine.UI.InputField input;
    public UnityEngine.UI.Button loginBtn;
    public UnityEngine.UI.Button sendBtn;

    public string uid;

    string user;
    

    chatofpomelo baseClient;
    void Awake()
    {
        baseClient = GetComponent<chatofpomelo>();
        baseClient.connectToConnector += onConnectToConnector;
        baseClient.disconnectConnector += onDisconnectConnector;
        baseClient.connectGateFailed += onConnectGateFailed;
    }

    // Use this for initialization
    void Start()
    {
        if (sendBtn) { sendBtn.interactable = true; }
        baseClient.uid = uid;
        baseClient.ConnectToGate();
    }


    public void send()
    {
        this.send(input.text);
    }

    public void send(string message)
    {
        chatHandler.send(
            "pomelo",
            message,
            user,
            "*"
            );
    }

    public void login()
    {
        user = "pomelo" + DateTime.Now.Millisecond;

        entryHandler.enter(user, "pomelo", delegate (entryHandler.enter_result result)
        {
            if (sendBtn) { sendBtn.interactable = true; }
        });
    }

    void onConnectToConnector()
    {
        ServerEvent.onChat(delegate (ServerEvent.onChat_event ret)
        {
            string strMsg = string.Format("{0} : {1}.", ret.from, ret.msg);
            if (text)
            {
                text.text = text.text.Insert(text.text.Length, strMsg);
                text.text = text.text.Insert(text.text.Length, "\n");
            }
        });

        ServerEvent.onAdd(delegate (ServerEvent.onAdd_event msg)
        {
            string strMsg = string.Format("{0} Joined.", msg.user);
            if (text)
            {
                text.text = text.text.Insert(text.text.Length, strMsg);
                text.text = text.text.Insert(text.text.Length, "\n");
            }
        });

        ServerEvent.onLeave(delegate (ServerEvent.onLeave_event msg)
        {
            string strMsg = string.Format("{0} Leaved.", msg.user);
            if (text)
            {
                text.text = text.text.Insert(text.text.Length, strMsg);
                text.text = text.text.Insert(text.text.Length, "\n");
            }
        });


        login();
    }

    void onDisconnectConnector()
    {
        if (loginBtn) { loginBtn.gameObject.SetActive(true); }
        if (sendBtn) { sendBtn.interactable = false; }
    }

    void onConnectGateFailed()
    {
        if (loginBtn) { loginBtn.gameObject.SetActive(true); }
        if (sendBtn) { sendBtn.interactable = false; }
    }
}
