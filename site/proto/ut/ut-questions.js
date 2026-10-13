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
10,4,db-q3,yesno,Would you use the journal and AI companion?,,n,y`
};
