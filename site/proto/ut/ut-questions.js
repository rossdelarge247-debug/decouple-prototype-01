/* Decouple — user testing: default question table + config.
   Live questions come from a Google Sheet published as CSV (set in the hub, or SHEET_CSV below).
   Columns: proto, order, id, type, question, options, required, active
   proto  = 01–10 (or stage id: discover, interview … dashboard), or "all" for every prototype
   type   = recap | rating5 | ease7 | choice | yesno | task | intro | probe
   intro  = the "Up next" card for that prototype: question = what it covers, options = rough time (e.g. 4 min)
   probe  = dwell check-in prompts (proto "all" or a number). With options = tap answers; without = free text.
   options= choice / probe only, separated by |
   required / active = y or n */
window.UT_DEFAULTS = {
  SHEET_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGTqhfBHifNU9XD0lKf1pQ9G5g3CB6pwbftABHtryj3QpnrSX0HKszJ5rD0LCp42x789HgIeHxSXYp/pub?gid=1388760086&single=true&output=csv",
  FORM_PREFILL: "https://docs.google.com/forms/d/e/1FAIpQLSfo4z7lzvv_MXWJ_cq2tbJYVy_FL3xgzlhlCJNi5eYLHw9_3g/viewform?usp=pp_url&entry.639265413=SID&entry.1014815712=PID&entry.1930035937=PROTO&entry.1955689092=QID&entry.944385192=QUESTION&entry.1022339360=TYPE&entry.703772202=ANSWER&entry.1125197706=TIME&entry.235542517=DEVICE",
  DWELL: 75, REPEAT: 150, MAX_PROBES: 2,
  CSV: `proto,order,id,type,question,options,required,active
all,1,pb-1,probe,How's it going so far?,All good|A bit unsure|I'm stuck,,y
all,2,pb-2,probe,What do you think is happening on this screen?,,,y
all,3,pb-3,probe,What would you expect to happen next?,,,y
all,4,pb-4,probe,Is there anything you'd change here?,,,y
all,5,pb-5,probe,What are you looking for right now?,,,y
01,0,d-in,intro,"You've just heard about Decouple. Look around the public site, find out what it does and what it costs, then start the free interview.",3 min,,y
02,0,i-in,intro,"A short, private interview about your situation, as Sarah. Rough figures are fine. Notice how the questions feel to answer.",5 min,,y
03,0,p-in,intro,"Your answers come back as a first read: what a court might see as fair, and a path forward. Decide whether you'd pay to go further.",3 min,,y
04,0,s-in,intro,"Choose a plan, decide how to pay and create an account. Payment is pretend.",3 min,,y
05,0,o-in,intro,"Your first day: connect a bank (simulated) and take a short tour of what's ahead.",4 min,,y
06,0,pr-in,intro,"Build Sarah's financial picture, then share it with Mark. Pay attention to what's private and what's shared.",6 min,,y
07,0,h-in,intro,"Mark has shared his picture. Check it, query anything that looks off, and agree the household picture together.",6 min,,y
08,0,st-in,intro,"Propose how to split things, answer Mark's counter, and sign the agreement. Use the Tweaks to jump ahead if you need to.",8 min,,y
09,0,f-in,intro,"Turn the agreement into court documents, review and sign them with Mark, then file and track them.",8 min,,y
10,0,db-in,intro,"Weeks later, you log back in. See what needs doing, what's waiting on Mark, and where your documents are.",4 min,,y
01,1,d-r1,recap,Explored the public site: what Decouple does and what it costs,,,y
01,2,d-r2,recap,Answered two quick questions about where you are,,,y
01,3,d-q1,task,Were you able to find how to get started?,,y,y
01,4,d-q2,rating5,How clear was what Decouple does?,,y,y
01,5,d-q3,choice,What would most make you trust it?,Price and time saving|Legal accuracy|Privacy and safety|Reviews from real people,n,y
02,1,i-r1,recap,Answered the free interview about your situation,,,y
02,2,i-r2,recap,Watched your picture so far build up as you went,,,y
02,3,i-q1,ease7,How easy was the interview to complete?,,y,y
02,4,i-q2,rating5,How comfortable did the questions feel to answer?,,y,y
02,5,i-q3,yesno,Was anything asked that you didn't want to answer?,,y,y
03,1,p-r1,recap,Saw a first read: the share a court would likely see as reasonable,,,y
03,2,p-r2,recap,Saw a three-month path and things to watch,,,y
03,3,p-q1,rating5,How believable did your first read feel?,,y,y
03,4,p-q2,yesno,Would you pay to go further after seeing this?,,y,y
03,5,p-q3,choice,What stood out most?,The likely range|The three-month path|Things to watch|The parenting pattern,n,y
04,1,s-r1,recap,Chose a plan and how to pay,,,y
04,2,s-r2,recap,Created an account,,,y
04,3,s-q1,task,Were you able to choose a plan and pay?,,y,y
04,4,s-q2,rating5,How fair did the price feel?,,y,y
04,5,s-q3,yesno,Did splitting the cost with your partner make sense?,,n,y
05,1,o-r1,recap,Connected a bank and saw your picture start to draft itself,,,y
05,2,o-r2,recap,Took the short welcome tour,,,y
05,3,o-q1,rating5,How comfortable were you connecting your bank?,,y,y
05,4,o-q2,ease7,How easy was it to understand what happens next?,,y,y
06,1,pr-r1,recap,Built your financial picture section by section,,,y
06,2,pr-r2,recap,Shared it with your partner,,,y
06,3,pr-q1,task,Were you able to complete and share your picture?,,y,y
06,4,pr-q2,yesno,Would you feel comfortable sharing first?,,y,y
06,5,pr-q3,ease7,How easy was it to tell what's private and what's shared?,,y,y
07,1,h-r1,recap,Checked your partner's picture and raised queries,,,y
07,2,h-r2,recap,Agreed and signed the household picture,,,y
07,3,h-q1,ease7,How easy was it to agree or query each item?,,y,y
07,4,h-q2,rating5,How fair did the process feel?,,y,y
08,1,st-r1,recap,Made a proposal and answered your partner's counter,,,y
08,2,st-r2,recap,Reached an agreement and signed it,,,y
08,3,st-q1,task,Were you able to reach and sign the agreement?,,y,y
08,4,st-q2,rating5,How helpful were the court-reasonableness tags?,,y,y
08,5,st-q3,yesno,Did the tags ever feel like judgement?,,y,y
08,6,st-q4,choice,What would you do before signing?,Sign it as it is|Use the AI advisor|Send it to a solicitor|Book a mediator,n,y
09,1,f-r1,recap,Reviewed and signed the court documents together,,,y
09,2,f-r2,recap,Ran the checks and filed with the court,,,y
09,3,f-q1,task,Were you able to sign and file?,,y,y
09,4,f-q2,ease7,How easy was it to understand the documents?,,y,y
09,5,f-q3,rating5,How confident would you feel filing this for real?,,y,y
10,1,db-r1,recap,Came back to your dashboard,,,y
10,2,db-q1,ease7,How easy was it to see what to do next?,,y,y
10,3,db-q2,rating5,How useful was the evidence vault?,,y,y
10,4,db-q3,yesno,Would you use the journal and AI companion?,,n,y
mvp05,0,m5-in,intro,"The money step. Fill in your side of a financial statement with exact figures (no bank connection), invite your partner, check both sides together, agree it's complete, then see the finished pack.",10 min,,y
mvp05,1,m5-r1,recap,Filled in your side of the statement with exact figures and where they came from,,,y
mvp05,2,m5-r2,recap,Saw both sides together and sorted out what was missing or didn't match,,,y
mvp05,3,m5-r3,recap,Agreed it was complete and saw the finished disclosure pack and its price,,,y
mvp05,4,m5-q1,ease7,How easy was it to give exact figures for each thing?,,y,y
mvp05,5,m5-q2,choice,"Where you couldn't give an exact figure, what did you do?",Guessed|Ticked 'don't know yet'|Stopped to look it up|Didn't notice,n,y
mvp05,6,m5-q3,rating5,How useful were the flags (missing / doesn't match) for spotting problems?,,y,y
mvp05,7,m5-q4,yesno,Would you be comfortable inviting your partner to this?,,y,y
mvp05,8,m5-q5,choice,Which would you take to the next step?,Open financial statement|D81 figures|Form E draft|None of these,n,y
mvp05,9,m5-q6,rating5,"Compared with sending spreadsheets by email, how much better is this?",,y,y
mvp05,10,m5-q7,choice,What would you pay for the finished disclosure pack?,Nothing|Up to £30|£30–£50|£50–£80|More than £80,n,y
mvp05,11,m5-q8,yesno,Would you rather the bank connection filled it in for you?,,n,y
mvp00,0,m0-in,intro,"The toolkit's public pages. Look around as if you'd just found it: what it is, what's free, what costs money, and whether it's safe. Then start the free guide.",4 min,,y
mvp00,1,m0-r1,recap,Looked around the public pages,,,y
mvp00,2,m0-r2,recap,Found what's free and what costs money,,,y
mvp00,3,m0-r3,recap,Started the free guide,,,y
mvp00,4,m0-q1,rating5,How clear was what Decouple is?,,y,y
mvp00,5,m0-q2,rating5,"How clear was what's free, what needs an account, and what costs money?",,y,y
mvp00,6,m0-q3,choice,What would most make you trust it?,That it's free to try|No account to start|The safety and privacy page|The 'is it right for us?' check|Nothing yet,n,y
mvp00,7,m0-q4,yesno,Did having to start with the guide put you off?,,y,y
mvp00,8,m0-q5,choice,Which page would you look at first?,How it works|The tools|Prices|Is it right for us?|Safety & privacy|FAQ,n,y
mvp01,0,m1-in,intro,"A free divorce toolkit. See the landing page, get your guide, save your toolkit and look around the tools in it.",4 min,,y
mvp01,1,m1-r1,recap,Saw what the toolkit offers and what costs money,,,y
mvp01,2,m1-r2,recap,Got your guide and chose whether to save your toolkit,,,y
mvp01,3,m1-r3,recap,Looked around the toolkit home,,,y
mvp01,4,m1-q1,rating5,How clear was what's free and what you'd pay for?,,y,y
mvp01,5,m1-q2,rating5,"How well does ""Your divorce toolkit"" describe it?",,y,y
mvp01,6,m1-q3,yesno,Would you create a free account to save your toolkit?,,y,y
mvp01,7,m1-q4,choice,What would most make you trust it with your details?,The privacy promises|Knowing who's behind it|Reviews from people like me|Being regulated|Nothing would,n,y
mvp01,8,m1-q5,choice,Which tool would you open first?,Is doing it ourselves right for us?|To-do list & journal|Parenting plan|Financial statement|Split planner|Ask,y,y
mvp01,9,m1-q6,rating5,How likely are you to come back to it over the coming months?,,y,y
mvp01,10,m1-q7,yesno,Is anything missing that you'd expect in a divorce toolkit?,,n,y
mvp02,0,m2-in,intro,"Before you begin: fifteen honest questions about safety, control, how you talk and how complicated things are. At the end it says plainly whether to get advice first. Answer as yourself, or as someone you imagine.",5 min,,y
mvp02,1,m2-r1,recap,Answered questions about safety and control,,,y
mvp02,2,m2-r2,recap,Answered questions about how you talk and your situation,,,y
mvp02,3,m2-r3,recap,Saw a result: get advice first / get help with some parts / it could work,,,y
mvp02,4,m2-q1,rating5,How comfortable were the safety questions to answer?,,y,y
mvp02,5,m2-q2,rating5,How much did you trust the result?,,y,y
mvp02,6,m2-q3,yesno,Did anything feel judgemental?,,y,y
mvp02,7,m2-q4,yesno,Would you be worried about someone seeing this on your phone?,,y,y
mvp02,8,m2-q5,choice,Where would you want this check?,Before the guide|After the guide|In the toolkit|Nowhere,n,y
mvp03,0,m3-in,intro,"Get organised: a to-do list made from your guide, and a private journal with a companion you can talk an entry through with.",5 min,,y
mvp03,1,m3-r1,recap,Looked through the to-do list and ticked something off,,,y
mvp03,2,m3-r2,recap,Wrote or read a journal entry,,,y
mvp03,3,m3-r3,recap,Talked an entry through with the companion,,,y
mvp03,4,m3-q1,rating5,How useful was a to-do list made from your guide?,,y,y
mvp03,5,m3-q2,yesno,Would you keep a journal here?,,y,y
mvp03,6,m3-q3,rating5,How helpful was the companion?,,n,y
mvp03,7,m3-q4,choice,What would bring you back each week?,The to-do list|The journal|Reminders|Nothing,n,y
mvp04,0,m4-in,intro,"The children: build a parenting plan, from where they live to holidays and money, then see it as one document.",6 min,,y
mvp04,1,m4-r1,recap,Chose a pattern for where the children live,,,y
mvp04,2,m4-r2,recap,"Set out handovers, holidays and decisions",,,y
mvp04,3,m4-r3,recap,Saw the finished plan,,,y
mvp04,4,m4-q1,ease7,How easy was it to set out the arrangements?,,y,y
mvp04,5,m4-q2,rating5,How useful was the two-week calendar?,,y,y
mvp04,6,m4-q3,yesno,Would you share this plan with your partner?,,y,y
mvp04,7,m4-q4,yesno,Is anything missing from the plan?,,n,y
mvp04,8,m4-q5,choice,Should it come before the money in the toolkit?,Yes|No|Doesn't matter,n,y
mvp06,0,m6-in,intro,"Agree what's fair: try different splits of the home, pensions, savings and debts, and see how a court would likely see each. Then the agreement and its finished pack.",6 min,,y
mvp06,1,m6-r1,recap,Tried different splits and watched the tags change,,,y
mvp06,2,m6-r2,recap,Read the agreement summary,,,y
mvp06,3,m6-r3,recap,Saw the agreement pack and its price,,,y
mvp06,4,m6-q1,rating5,How well did you understand the Strong / Reasonable / A stretch tags?,,y,y
mvp06,5,m6-q2,rating5,How much would you trust them?,,y,y
mvp06,6,m6-q3,yesno,Did it feel like advice on what you should do?,,y,y
mvp06,7,m6-q4,choice,What would you pay for the finished agreement pack?,Nothing|Up to £80|£80–£150|£150–£250|More than £250,n,y
mvp06,8,m6-q5,yesno,Would you still want a solicitor to check it?,,y,y
mvp07,0,m7-in,intro,"Ask: an AI sounding board with five modes. Try at least two: ask a question, get ready for a meeting, explain a letter, calm a message, or talk something through.",6 min,,y
mvp07,1,m7-r1,recap,Asked a question and read the answer and its sources,,,y
mvp07,2,m7-r2,recap,Tried at least one other mode,,,y
mvp07,3,m7-q1,rating5,How much did you trust the answers?,,y,y
mvp07,4,m7-q2,yesno,Would you rely on it for a real decision?,,y,y
mvp07,5,m7-q3,choice,Which mode was most useful?,Ask anything|Get ready for a meeting|Explain this letter|Say it calmly|Talk it through,y,y
mvp07,6,m7-q4,rating5,"Compared with asking ChatGPT, how much better was it?",,n,y
mvp07,7,m7-q5,yesno,Would you be comfortable pasting a real letter into it?,,y,y
mvp08,0,m8-in,intro,"Help & support: official information and where to get help, in the order a separation usually runs. Find the answer to one real question you have, then look at the financial disclosure section.",5 min,,y
mvp08,1,m8-r1,recap,Found a topic that matters to you and read it,,,y
mvp08,2,m8-r2,recap,Looked at the financial disclosure section,,,y
mvp08,3,m8-r3,recap,Asked the assistant at the top a question,,,y
mvp08,4,m8-q1,ease7,How easy was it to find what you were looking for?,,y,y
mvp08,5,m8-q2,yesno,Did it answer your question?,,y,y
mvp08,6,m8-q3,rating5,How much did you trust it?,,y,y
mvp08,7,m8-q4,choice,"Compared with searching GOV.UK yourself, was it…",Much easier|A bit easier|About the same|Harder,y,y
mvp08,8,m8-q5,choice,What was missing?,Nothing|A topic I needed|Plainer words|What to do next|Someone to ask,n,y
mvp08,9,m8-q6,yesno,Would you come back to it?,,y,y
mvp08,10,m8-q7,rating5,How useful were the assistant’s answers?,,n,y
mvp08,11,m8-q8,choice,Where did you look first?,The assistant|The topics|Both,n,y`
};
