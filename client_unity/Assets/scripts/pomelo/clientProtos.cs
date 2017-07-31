using System;
using LitJson;
using Pomelo.DotNetClient;
namespace Proto
{
    public static class Version
    {
        public static void resetClient(PomeloClient pc)
        {
            gate.gateHandler.pc = pc;
            connector.entryHandler.pc = pc;
            chat.chatHandler.pc = pc;
            ServerEvent.pc = pc;
        }
    }
    namespace chat
    {
        public class chatHandler
        {
            public static PomeloClient pc = null;
            public static bool send(string rid,string content,string from,string target)
            {
                JsonData data = new JsonData();
                data["rid"] = rid;
                data["content"] = content;
                data["from"] = from;
                data["target"] = target;
                pc.notify("chat.chatHandler.send", data);
                return true;
            }
        }
    }
    namespace connector
    {
        public class entryHandler
        {
            public static PomeloClient pc = null;
            public class enter_result
            {
                public string[] users;
                public JsonData ToJson()
                {
                    JsonData data = new JsonData();
                    for(int i=0;
                    i<users.Length;
                    ++i)
                    {
                        data["users"].Add(users[i]);
                    }
                    return data;
                }
                public void FromJson(JsonData ret)
                {
                    if(ret.ContainsKey("users") && ret["users"].IsArray && ret["users"].Count > 0)
                    {
                        this.users = new string[ret["users"].Count];
                        for(int i=0;
                        i<ret["users"].Count;
                        ++i)
                        {
                            this.users[i]=(string)ret["users"][i];
                        }
                    }
                }
            }
            public static bool enter(string username,string rid,System.Action<enter_result> cb)
            {
                JsonData data = new JsonData();
                data["username"] = username;
                data["rid"] = rid;
                pc.request("connector.entryHandler.enter", data, delegate (JsonData ret)
                {
                    enter_result result = new enter_result();
                    if(ret.ContainsKey("users") && ret["users"].IsArray && ret["users"].Count > 0)
                    {
                        result.users = new string[ret["users"].Count];
                        for(int i=0;
                        i<ret["users"].Count;
                        ++i)
                        {
                            result.users[i]=(string)ret["users"][i];
                        }
                    }
                    cb(result);
                }
                );
                return true;
            }
        }
    }
    namespace gate
    {
        public class gateHandler
        {
            public static PomeloClient pc = null;
            public class queryEntry_result
            {
                public int code;
                public string host;
                public int port;
                public JsonData ToJson()
                {
                    JsonData data = new JsonData();
                    data["code"] = code;
                    data["host"] = host;
                    data["port"] = port;
                    return data;
                }
                public void FromJson(JsonData ret)
                {
                    this.code= ret.ContainsKey("code")?(int)ret["code"]:0;
                    this.host= ret.ContainsKey("host")?(string)ret["host"]:"";
                    this.port= ret.ContainsKey("port")?(int)ret["port"]:0;
                }
            }
            public static bool queryEntry(string uid,System.Action<queryEntry_result> cb)
            {
                JsonData data = new JsonData();
                data["uid"] = uid;
				pc.request("gate.gateHandler.guestLogin", data, delegate (JsonData ret)
                {
                    queryEntry_result result = new queryEntry_result();
                    result.code= ret.ContainsKey("code")?(int)ret["code"]:0;
                    result.host= ret.ContainsKey("host")?(string)ret["host"]:"";
                    result.port= ret.ContainsKey("port")?(int)ret["port"]:0;
                    cb(result);
                }
                );
                return true;
            }
        }
    }
    public class ServerEvent
    {
        public static PomeloClient pc = null;
        public class onAdd_event
        {
            public string user;
            public JsonData ToJson()
            {
                JsonData data = new JsonData();
                data["user"] = user;
                return data;
            }
            public void FromJson(JsonData ret)
            {
                this.user= ret.ContainsKey("user")?(string)ret["user"]:"";
            }
        }
        public static bool onAdd(System.Action<onAdd_event> cb)
        {
            pc.on("onAdd", delegate (JsonData ret)
            {
                onAdd_event result = new onAdd_event();
                if(ret.ContainsKey("user"))
                {
                    result.user = (string)ret["user"];
                }
                cb(result);
            }
            );
            return true;
        }
        public class onChat_event
        {
            public string msg;
            public string from;
            public string target;
            public JsonData ToJson()
            {
                JsonData data = new JsonData();
                data["msg"] = msg;
                data["from"] = from;
                data["target"] = target;
                return data;
            }
            public void FromJson(JsonData ret)
            {
                this.msg= ret.ContainsKey("msg")?(string)ret["msg"]:"";
                this.from= ret.ContainsKey("from")?(string)ret["from"]:"";
                this.target= ret.ContainsKey("target")?(string)ret["target"]:"";
            }
        }
        public static bool onChat(System.Action<onChat_event> cb)
        {
            pc.on("onChat", delegate (JsonData ret)
            {
                onChat_event result = new onChat_event();
                if(ret.ContainsKey("msg"))
                {
                    result.msg = (string)ret["msg"];
                }
                if(ret.ContainsKey("from"))
                {
                    result.from = (string)ret["from"];
                }
                if(ret.ContainsKey("target"))
                {
                    result.target = (string)ret["target"];
                }
                cb(result);
            }
            );
            return true;
        }
        public class onLeave_event
        {
            public string user;
            public JsonData ToJson()
            {
                JsonData data = new JsonData();
                data["user"] = user;
                return data;
            }
            public void FromJson(JsonData ret)
            {
                this.user= ret.ContainsKey("user")?(string)ret["user"]:"";
            }
        }
        public static bool onLeave(System.Action<onLeave_event> cb)
        {
            pc.on("onLeave", delegate (JsonData ret)
            {
                onLeave_event result = new onLeave_event();
                if(ret.ContainsKey("user"))
                {
                    result.user = (string)ret["user"];
                }
                cb(result);
            }
            );
            return true;
        }
    }
}
