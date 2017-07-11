using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MPoker {
	int value;
	char color;
	public MPoker (int v, char c) {
		value = v;
		color = c;
	}

	public Sprite getSprite() {
		string filename = string.Format ("png/{0}{1}", value, color);
		Sprite spri = Resources.Load<Sprite> (filename);
		return spri;
	}
}
