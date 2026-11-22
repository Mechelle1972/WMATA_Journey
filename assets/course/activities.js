/* M3 participant eWorkbook activities. Titles, prompts and instructions come from the approved PowerPoint and its participant chat messages.
   No answer keys or sample responses. */
window.C2Activities=[
 {part:1,id:'part1',title:'My snapshot',slide:9,meta:'Individual · 4 minutes · Private. You won’t be asked to share it.',
  intro:'For each pair, mark the end you lean toward. Then note one time a preference helped and one time it caused friction.',
  blocks:[
   {type:'dials',label:'Mark the end you lean toward',dials:[['Directness','Headline first','Background first'],['Pace','Quick discussion','Time to process'],['Detail','Concise','Detailed'],['Relationship and context','Task first','Connection first']],note:'Preferences shift with the situation, the topic, and the person.'},
   {type:'text',key:'p1_helped',label:'One time a preference helped'},
   {type:'text',key:'p1_friction',label:'One time it caused friction'}]},
 {part:2,id:'part2',title:'One message, two versions',slide:15,meta:'Individual, then chat · 6 minutes',
  intro:'Write two versions of the base message. Add a realistic reason and deadline, and use the same request, reason, deadline, and next action in both versions. When time is called, post both versions in one chat message, labeled A and B.',
  blocks:[
   {type:'scenario',label:'Message',text:'We need to change how we share weekly updates.'},
   {type:'pair',items:[['A','Listener A','Wants the decision and deadline first'],['B','Listener B','Wants reasons, steps, and implications']]},
   {type:'text',key:'p2_a',label:'Version A: for Listener A',combo:'A'},
   {type:'text',key:'p2_b',label:'Version B: for Listener B',combo:'B'},
   {type:'combine',keys:['p2_a','p2_b'],labels:['A','B'],label:'Copy both (A and B)',name:'Copy both versions, labeled A and B'}]},
 {part:3,id:'part3',title:'Clarify and confirm',slide:21,meta:'Individual, then chat · 5 minutes',
  intro:'Write one clarifying question that asks about the gap, and one confirmation statement that restates what you understand and checks it. When time is called, post both in one chat message, labeled Q and C.',
  blocks:[
   {type:'scenario',label:'A colleague says',text:'“I didn’t get what I needed from that update, and now my team is behind.”'},
   {type:'text',key:'p3_q',label:'Q: My clarifying question',combo:'Q',rows:3},
   {type:'text',key:'p3_c',label:'C: My confirmation statement',combo:'C',rows:3},
   {type:'combine',keys:['p3_q','p3_c'],labels:['Q','C'],label:'Copy both (Q and C)',name:'Copy both, labeled Q and C'}]},
 {part:4,id:'part4',title:'Feedback rewrite',slide:26,meta:'Individual, then chat · 5 minutes',
  intro:'Rewrite your response using all four moves: Pause, Clarify, Paraphrase, and Identify a Next Step. When time is called, post your rewrite in chat.',
  blocks:[
   {type:'scenario',label:'A colleague says',text:'“Your updates are too detailed, and the team is missing the key decision.”'},
   {type:'scenario',label:'Your first reaction',text:'“But people keep asking me for more detail.”',soft:true},
   {type:'chips',items:['Pause','Clarify','Paraphrase','Next step']},
   {type:'text',key:'p4_rewrite',label:'My rewrite',rows:6}]},
 {part:5,id:'part5',title:'Check-in practice',slide:30,meta:'Round 1: individual · Round 2: small groups or main room',
  intro:'You’ll practice as Taylor. Write your response in Round 1, then test it and revise it in Round 2.',
  blocks:[
   {type:'scenario',label:'Scenario',text:'Two colleagues coordinate a recurring project update. Jordan wants a brief, decision-focused summary. Taylor sends extensive detail because recent work has changed a lot. Jordan says: “These updates are hard to use. I keep losing the decision.” Taylor feels criticized. Their next check-in must settle three things: format, timing, and ownership.'},
   {type:'checklist',key:'p5_check',label:'Four-point self-check',items:['Adapted pace, order, or detail to a stated need','Asked a neutral clarifying question','Confirmed the other person’s meaning','Responded to feedback and proposed a specific next step']},
   {type:'heading',text:'Round 1: Draft your response',meta:'Individual · 5 minutes'},
   {type:'para',text:'Write Taylor’s opening response to Jordan in complete sentences. Include: (1) an acknowledgment of Jordan’s concern, (2) one neutral clarifying question, (3) a confirmation of what Jordan needs, and (4) a proposed next step with format, deadline, and owner. Keep your draft. You’ll use it in Round 2. Use what Jordan said. Don’t guess a personality type.'},
   {type:'text',key:'p5_r1',label:'Round 1: My response as Taylor',rows:7},
   {type:'heading',text:'Round 2: Practice and revise',meta:'10 minutes'},
   {type:'para',text:'Say your Round 1 response out loud, hear how it lands, and use the four-point checklist to strengthen it. Make sure your next step names a format, deadline, and owner, and asks whether Jordan agrees. Be ready to post one change you made.'},
   {type:'text',key:'p5_r2',label:'Round 2: My revised response',rows:7}]},
 {part:6,id:'part6',title:'My commitment',slide:36,meta:'Individual, then chat · 3 minutes · Post in chat if you’re willing',
  intro:'Choose a real conversation in the next week or two. Complete the sentence frame. Your commitment stays private unless you choose to share it.',
  blocks:[
   {type:'frame',key:'p6',parts:['In my next ',{key:'p6_setting',label:'meeting, update, or feedback conversation'},', I will ',{key:'p6_action',label:'specific adjustment'},', and I’ll know it helped when ',{key:'p6_result',label:'observable result'},'.'],
    example:'In my next project update, I will put the decision and deadline in the first two lines, and I’ll know it helped when no one has to ask me for the deadline.'}]}
];
/* Quick reference: wording taken from the course slides. */
window.C2Reference=[
 {title:'Four dials you can adjust in any message',slide:8,rows:[['Directness','Headline first ↔ Background first'],['Pace','Quick discussion ↔ Time to process'],['Detail','Concise ↔ Detailed'],['Relationship and context','Task first ↔ Connection first']],note:'Preferences shift with the situation, the topic, and the person.'},
 {title:'Change the delivery. Keep the facts.',slide:17,rows:[['1 · Notice','Listen for the person’s stated needs.'],['2 · Adapt','Adjust order, pace, and level of detail.'],['3 · Preserve','Keep the request, reason, and next action accurate.']]},
 {title:'Listen → Clarify → Confirm',slide:19,rows:[['Listen','Give full attention. Notice what is said.'],['Clarify','Ask one neutral question about meaning or expectation.'],['Confirm','State your understanding. Check that it’s accurate.']],note:'Use it when information or expectations are unclear.'},
 {title:'Four moves for receiving feedback',slide:24,rows:[['1 · Pause','Acknowledge before you answer'],['2 · Clarify','Ask for a concrete example'],['3 · Paraphrase','Restate the concern in your words'],['4 · Identify a next step','Name a specific follow-up action']],note:'Use it when you receive a difficult message or concern.'},
 {title:'Three moves to take with you',slide:37,rows:[['Adapt based on cues','Adjust order, pace, and detail'],['Clarify before assuming','Ask one neutral question, then confirm'],['Agree on a next step','Name what happens, who owns it, and when']]}
];
