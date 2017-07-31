using UnityEngine;
using System.Collections;
using Proto.chat;
using Proto.connector;
using System;
using Proto;
using Proto.gate;

[RequireComponent(typeof(pomeloBehaviour))]
public class chatofpomelo : MonoBehaviour
{


    [TextArea(3, 10)]
    public string HandShakeCache;

    public string host = "127.0.0.1";
	public int port = 3101;
    pomeloBehaviour client;
    public string uid = "1";


    public Action connectToConnector;
    public Action disconnectConnector;
    public Action connectGateFailed;

    void Awake()
    {

        client = GetComponent<pomeloBehaviour>();
        client.updateClientEvent += OnUpdateClient;
    }
    // Use this for initialization


    public void ConnectToGate()
    {
        client.connectEvent += OnConnectToGate;
        client.closeEvent  += OnGateServerDisconnect;
        client.ConnectServer(host, port, Pomelo.DotNetClient.ClientProtocolType.NORMAL, HandShakeCache);
    }

    public void OnConnectToConnector()
    {
        client.closeEvent += OnServerDisconnect;
        

        this.HandShakeCache = client.GetHandShakeCache();

        if(connectToConnector != null)
        {
            connectToConnector.Invoke();
        }


        Debug.Log("Connector Connected");
      
    }
    public void OnConnectToGate()
    {
        this.HandShakeCache = client.GetHandShakeCache();
        //gate logic can moveto logicclient
        gateHandler.queryEntry(uid, delegate (gateHandler.queryEntry_result result)
        {
			Debug.Log(result.ToString());
            client.connectEvent -= OnConnectToGate;
            client.closeEvent -= OnGateServerDisconnect;

            client.CloseClient();

            if (result.code == 500)
            {
                //TODO
            }

            if (result.code == 200)
            {
                client.connectEvent += OnConnectToConnector;
                client.ConnectServer(result.host, result.port, Pomelo.DotNetClient.ClientProtocolType.NORMAL, HandShakeCache);
            }

            //TODO other event
        });
        Debug.Log("Gate Connected");
    }


    private void OnUpdateClient()
    {
        Proto.Version.resetClient(client.pc);
    }

    private void OnServerDisconnect()
    {
        client.connectEvent -= OnConnectToConnector;
        client.closeEvent -= OnServerDisconnect;

        if (disconnectConnector != null) disconnectConnector.Invoke();

    }

    private void OnGateServerDisconnect()
    {
        client.connectEvent -= OnConnectToGate;
        client.closeEvent -= OnGateServerDisconnect;

        if (connectGateFailed != null) connectGateFailed.Invoke();

    }
}
