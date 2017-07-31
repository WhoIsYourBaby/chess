using UnityEngine;
using System.Collections;

using Pomelo.DotNetClient;
using LitJson;
using System;
using System.Threading;
using System.Collections.Generic;
using System.IO;

using Proto;
using Proto.gate;
using Proto.connector;
using Proto.chat;


public class pomeloBehaviour : MonoBehaviour
{

    [HideInInspector]
    public PomeloClient pc;

    public event Action connectEvent;
    public event Action closeEvent;
    public event Action updateClientEvent;

    // Use this for initialization
    void Start()
    {

    }

    [ExecuteInEditMode]
    void OnDestroy()
    {
        CloseClient(); 
    }

    // Update is called once per frame
    void Update()
    {
        if (pc != null)
        {
            pc.poll();
        }
    }

    public void CloseClient()
    {
        if (pc != null)
        {
            pc.close();
            //pc.poll();
            if (this.closeEvent != null)
            {
                this.closeEvent();
            }
            pc = null;

            this.UpdateClient();
        }
    }

    public string GetHandShakeCache()
    {
        if(pc != null)
        {
            return pc.HandShakeCache;
        }
        return "";
    }

    //TODO TLS "C7773B9D1BF0C5C956C88C60440FA23C3889A403"
    public bool ConnectServer(string host, int port,
        ClientProtocolType eProtoType = ClientProtocolType.NORMAL,
        string HandShakeCache = "",
        byte[] clientcert = null, string clientpwd = "", string cathumbprint = null)
    {
        //if (eProtoType == ClientProtocolType.TLS)
        //{
        //    if (clientcert == null || cathumbprint == null)
        //    {
        //        return false;
        //    }
        //}

        //this.CloseClient();
        pc = new PomeloClient(eProtoType, clientcert, "", cathumbprint);
        pc.Connect(host, port, HandShakeCache, delegate ()
        {
            if (pc.IsConnected)
            {
                this.UpdateClient();
                pc.HandShake(null, delegate (JsonData data)
                {
                    if (this.connectEvent != null)
                    {
                        this.connectEvent();
                    }
                });
            }           
        },
        delegate ()
        {
            if (this.closeEvent != null)
            {
                this.closeEvent();
            }

        }
        );

        return true;
    }


    private void UpdateClient()
    {
        if (this.updateClientEvent != null)
        {
            this.updateClientEvent();
        }
    }


}
