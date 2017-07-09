using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GameConfig {

	public static Sprite loadResourceSpriteInSheet (string sheetFile, string spriteName) {
		Sprite[] tmpspr = Resources.LoadAll<Sprite>(sheetFile);
		for (int i = 0; i < tmpspr.Length; i++) {
			string sprString = tmpspr [i].name;
			if (sprString == spriteName) {
				return tmpspr [i];
			}
		}
		return null;
	}
}
