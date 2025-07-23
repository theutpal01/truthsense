"use client";
import Meter from '@/components/feedback/Meter'
import ScoreCard from '@/components/feedback/ScoreCard'
import WordsMeter from '@/components/feedback/WordsMeter';
import ScrollDiv from '@/components/ui/ScrollDiv';
import { Card, CardBody, CardHeader } from '@heroui/react'
import React from 'react'

const Report = () => {
	return (
		<div className='mx-auto container min-h-[100vh] overflow-auto'>
			<div className='py-8 flex flex-col mx-auto items-center justify-center gap-5 w-10/12 min-h-[100%]'>

				{/* First Section */}
				<div className='flex w-full items-center justify-center gap-5'>
					<div className='flex flex-col w-auto'>
						<ScoreCard percent={38} />
					</div>
					<div className='flex w-full justify-end flex-wrap gap-5'>
						<Meter type='fluency' score={80} />
						<Meter type='clarity' score={100} />
						<Meter type='grammar' score={30} />
						<Meter type='confidence' score={89} />
						<Meter type='posture' score={43} />
						<Meter type='structure' score={51} />
					</div>
				</div>

				{/* Second Section */}
				<div className='flex items-center justify-center gap-5'>
					<Card className='h-80 w-1/4 !flex p-5 grow'>
						<CardHeader>
							<h3>Your Transcript</h3>
						</CardHeader>
						<CardBody className='flex text-text h-72 overflow-auto'>
							<p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Placeat nemo quae doloribus ullam illum. Cumque commodi ad similique, totam quia quae earum aspernatur? Quam, sequi modi. Repellat voluptatibus aliquam eaque?
								Odio natus velit delectus incidunt, reprehenderit mollitia esse, porro dolorem repellat iusto accusamus id itaque eius distinctio! Suscipit est illum incidunt tenetur quos nostrum provident tempora similique! Iusto, aperiam a?
								Accusantium, blanditiis facere? Consequatur dolore perferendis tenetur rerum deleniti ea corrupti illo labore voluptas laboriosam nam exercitationem laudantium nulla molestias voluptatum, commodi cum quisquam non deserunt odio doloremque laborum in!
								Quasi tenetur quod iure amet reprehenderit quos optio! Perferendis veniam suscipit a ullam facilis temporibus numquam laboriosam asperiores, expedita nobis iste velit fuga id, aliquam voluptatibus sed vel voluptatum minus.
								Dolorum maxime alias minima sed, nemo quidem fugiat laboriosam itaque. Blanditiis provident, fuga magni expedita soluta maxime? Voluptatum laboriosam voluptatibus quasi eius totam? Odio, modi natus tempora delectus sunt dolor!
								Doloribus sint eligendi dolore mollitia animi eius repudiandae nostrum id accusamus, voluptate veritatis consequuntur libero nam voluptates esse inventore quisquam vel illum quod aliquam beatae similique fuga quae. Doloribus, quod?
								Ipsum aperiam architecto deleniti dolores quidem harum cum repellendus doloremque id repudiandae maxime eius provident accusantium iure nulla, expedita ab. Corporis vero ipsum veniam doloremque dicta repellat, magni ullam nesciunt.
								Veniam voluptatem deleniti quod molestiae provident quos ipsum debitis molestias ut, ipsa distinctio fugit eveniet necessitatibus quia labore voluptates dignissimos. Neque quam voluptatem in? Magni aliquid sunt corrupti recusandae. Quia.
								Voluptatum nam facere excepturi explicabo. Porro omnis reiciendis voluptates sint illo, corrupti, aliquid fugiat tempora odit, at distinctio blanditiis optio quam placeat! Repellat nihil amet culpa nulla reiciendis doloremque harum.
								Aliquam explicabo, in tempora temporibus architecto at ab aut doloribus repudiandae amet ipsa possimus minus sit! Rem eaque quo beatae autem quos labore assumenda minus dolorum natus quibusdam, fuga doloremque.
								Dolor, autem earum, odio obcaecati fugiat necessitatibus quia ratione consectetur magnam iure porro! Voluptatum exercitationem ad modi similique velit, vitae nam culpa! Sit ipsum itaque veniam, laudantium autem nesciunt eos.
								Quasi, doloribus. Officiis illum in maiores consequuntur dolor! Eaque cum molestias quae provident optio veritatis. Nisi quibusdam quaerat tenetur, ea placeat aut nobis soluta. Quis recusandae a aspernatur unde assumenda.
								Earum quos incidunt sequi tempora aliquid molestias cum sit doloribus hic quia ex itaque possimus inventore facilis vel unde veritatis similique alias, odit nobis laborum vero, omnis sunt. Nihil, odio!
								Labore reprehenderit blanditiis accusantium aliquam nostrum expedita, obcaecati nam ea temporibus quia, sed facere nobis cumque et ipsa delectus, tenetur eaque quos. Eum magnam perferendis commodi quidem est harum repellendus.
							</p>
						</CardBody>
					</Card>

					<WordsMeter wpm={170} />
				</div>

				{/* Third Section */}
				<div className='flex items-center justify-center gap-5'>
					<ScrollDiv className='h-80 w-5/12 flex p-5 grow' heading='Fluency Evaluator'>
						<p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Placeat nemo quae doloribus ullam illum. Cumque commodi ad similique, totam quia quae earum aspernatur? Quam, sequi modi. Repellat voluptatibus aliquam eaque?
							Odio natus velit delectus incidunt, reprehenderit mollitia esse, porro dolorem repellat iusto accusamus id itaque eius distinctio! Suscipit est illum incidunt tenetur quos nostrum provident tempora similique! Iusto, aperiam a?
							Accusantium, blanditiis facere? Consequatur dolore perferendis tenetur rerum deleniti ea corrupti illo labore voluptas laboriosam nam exercitationem laudantium nulla molestias voluptatum, commodi cum quisquam non deserunt odio doloremque laborum in!
							Quasi tenetur quod iure amet reprehenderit quos optio! Perferendis veniam suscipit a ullam facilis temporibus numquam laboriosam asperiores, expedita nobis iste velit fuga id, aliquam voluptatibus sed vel voluptatum minus.
							Dolorum maxime alias minima sed, nemo quidem fugiat laboriosam itaque. Blanditiis provident, fuga magni expedita soluta maxime? Voluptatum laboriosam voluptatibus quasi eius totam? Odio, modi natus tempora delectus sunt dolor!
						</p>
					</ScrollDiv>

					<ScrollDiv className='h-80 w-7/12 flex p-5 grow' heading='Posture Evaluator'>
						<p>So, um, I used to be terrified of speaking up in front of a group. I remember this one time I had to present my work. Um, my mind just went completely blank. I just rambled.
							Afterwards, I knew I had to do something. I started wait. No. I just began practicing on my own, talking into my phone, but listening back was rough. I could hear all the ums, but I didn&apos;t really know what else to fix.
							I just kept wishing there was an easier way to see if I was actually improving. Still, I kept at it. And fast forward a few months to the next time I had to speak up.
							I was still nervous, but I had a clear message. It wasnt about it wasn&apos;t about becoming a perfect speaker. The real win was, um, just feeling heard, and that made all the difference.
							Afterwards, I knew I had to do something. I started wait. No. I just began practicing on my own, talking into my phone, but listening back was rough. I could hear all the ums, but I didn&apos;t really know what else to fix.
						</p>
					</ScrollDiv>
				</div>

				{/* Fourth Section */}
				<Card className='w-full p-5'>
					<CardHeader className='text-lg font-medium'>Language Coach</CardHeader>
					<div className='flex gap-5'>
						<ScrollDiv color='success' className='h-80 w-1/2 flex p-5 grow' size='h-72' heading='What went well:'>
							<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, voluptatibus! Quisquam, doloremque. Quod, voluptatibus. Quisquam, doloremque. Quod, voluptatibus.</p>
						</ScrollDiv>

						<ScrollDiv color='warning' className='h-80 w-1/2 flex p-5 grow' size='h-72' heading='Areas for Improvement:'>
							<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, voluptatibus! Quisquam, doloremque. Quod, voluptatibus. Quisquam, doloremque. Quod, voluptatibus.</p>
						</ScrollDiv>

					</div>
				</Card>


				{/* Fifth Section */}
				<Card className='w-full p-5'>
					<CardHeader className='text-lg font-medium'>Speech Evaluator</CardHeader>
					<div className='flex gap-5'>
						<ScrollDiv color='success' className='h-80 w-1/2 flex p-5 grow' size='h-72' heading='What went well:'>
							<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, voluptatibus! Quisquam, doloremque. Quod, voluptatibus. Quisquam, doloremque. Quod, voluptatibus.</p>
						</ScrollDiv>

						<ScrollDiv color='warning' className='h-80 w-1/2 flex p-5 grow' size='h-72' heading='Areas for Improvement:'>
							<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, voluptatibus! Quisquam, doloremque. Quod, voluptatibus. Quisquam, doloremque. Quod, voluptatibus.</p>
						</ScrollDiv>

					</div>
				</Card>

			</div>
		</div >
	)
}

export default Report