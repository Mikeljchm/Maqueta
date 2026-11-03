import os, sys, json, base64, urllib.request, wave, time
KEY=os.environ["GEMINI_API_KEY"]
def tts(text, voice, model, out):
    body={"contents":[{"parts":[{"text":text}]}],
          "generationConfig":{"responseModalities":["AUDIO"],
            "speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":voice}}}}}
    req=urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(body).encode(), headers={"x-goog-api-key":KEY,"Content-Type":"application/json"})
    try: r=json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e: print(voice, e.code, e.read()[:400].decode()); return False
    pcm=base64.b64decode(r["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
    with wave.open(out,"wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
    print(voice, "ok", round(len(pcm)/48000,1),"s", r.get("usageMetadata")); return True
if __name__=="__main__":
    text=open(sys.argv[1]).read(); model=sys.argv[2]
    for i,v in enumerate(sys.argv[3:]):
        tts(text, v, model, f"{v}.wav"); time.sleep(2)
