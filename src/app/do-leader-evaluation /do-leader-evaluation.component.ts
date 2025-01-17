import { Component, OnInit } from '@angular/core';
import { DoLeaderEvaluationService } from './services/do-leader-evaluation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../login/services/auth.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-do-user-evaluation',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './do-leader-evaluation.component.html',
  styleUrls: ['./do-leader-evaluation.component.scss']
})
export class DoLeaderEvaluationComponent implements OnInit {
  evaluationForm: FormGroup | any;

  leaderQuestions: any[] = [];
  answers: { questionId: number; answerNumber: number }[] = [];
  userId: number = 0;
  status: number = 0;
  dateReference: string = '';
  evaluatorId: number | null = null;
  leaderId: number | null = null;

  constructor(
    private evaluationService: DoLeaderEvaluationService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private http: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
  
    this.route.queryParams.subscribe(params => {
      this.evaluatorId = +params['evaluatorId'] || null;
      this.leaderId = +params['leaderId'] || null;
      
      console.log('Parâmetros recebidos:', { evaluatorId: this.evaluatorId, leaderId: this.leaderId });
    });

    // Inicialize o evaluationForm primeiro
    this.evaluationForm = this.fb.group({
      // improvePoints: ['', Validators.required],
      // pdi: ['', Validators.required],
      // goals: ['', Validators.required],
      // sixMonthAlignment: ['', Validators.required],
      // date: ['', Validators.required],
      // planoAndamento: ['', Validators.required],
      // justificativaPlano: ['', Validators.required],
      // metasAndamento: ['', Validators.required],
      // justificativaMetas: ['', Validators.required],
      // resultadosSemestre: ['', Validators.required],
      // consideracoesAnalise: ['', Validators.required],
      leaderAnswers: this.fb.array([], Validators.required)
    });
    
  
    // Agora você pode se inscrever em valueChanges
    // this.evaluationForm.valueChanges.subscribe(() => {
    //   this.updateSixMonthAlignment();
    // });
  
    this.loadQuestions();
  
    // Calcula a data de hoje e a data de seis meses a partir de hoje
    const today = new Date();
    const sixMonthsFromToday = new Date();
    sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + 6);
  
    this.dateReference = `${this.formatDate(today)} até ${this.formatDate(sixMonthsFromToday)}`;
  }
  

  // Função para formatar a data no formato dd/mm/yyyy
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0'); // Dia com dois dígitos
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mês com dois dígitos
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }


  loadQuestions(): void {
    this.evaluationService.getQuestions().subscribe(
      (response: any) => {
        this.leaderQuestions = response.data;
  
        const answersFormArray = this.evaluationForm.get('leaderAnswers') as FormArray;
        answersFormArray.clear();
  
        this.leaderQuestions.forEach(() => {
          answersFormArray.push(this.fb.control('', Validators.required));
        });
      },
      error => {
        console.error('Erro ao carregar questões:', error);
      }
    );
  }
  

  submitEvaluation(): void {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      return;
    }
  
    // Se employeeId e evaluatorId não foram passados, define-os como o ID do usuário logado (autoavaliação)
    const leaderId = this.leaderId ?? this.userId;
    const evaluatorId = this.evaluatorId ?? this.userId;
  
    // Verifica novamente se employeeId e evaluatorId são válidos (após a definição para autoavaliação)
    if (leaderId === null || evaluatorId === null) {
      console.error('employeeId ou evaluatorId estão indefinidos');
      return;
    }
  
    // Coleta as respostas do FormArray
    const answersFormArray = this.evaluationForm.get('leaderAnswers') as FormArray;
    const answers = this.leaderQuestions.map((question, index) => ({
      questionId: question.questionId,
      answerNumber: answersFormArray.at(index).value
    }));
  
    const evaluationData = {
      leaderId: leaderId,
      evaluatorId: evaluatorId,
      status: this.status,
      dateReference: this.dateReference,
      leaderAnswers: answers,
      // improvePoints: this.evaluationForm.get('improvePoints').value,
      // pdi: this.evaluationForm.get('pdi').value,
      // goals: this.evaluationForm.get('goals').value,
      // sixMonthAlignment: this.evaluationForm.get('sixMonthAlignment').value
    };
  
    this.evaluationService.submitEvaluation(evaluationData).subscribe(
      (response: any) => {
        console.log('Avaliação enviada com sucesso!', response);
        const evaluationId = response.data;
  
        if (evaluationId) {
          this.completeEvaluation(evaluationId);
          this.http.navigate(['/home']);
        } else {
          console.error('ID da avaliação não encontrado na resposta do backend.');
        }
      },
      error => {
        console.error('Erro ao enviar avaliação:', error);
      }
    );
  }
    
  completeEvaluation(evaluationId: number): void {
    this.evaluationService.completeEvaluation(evaluationId).subscribe(
      () => {
        console.log('Avaliação marcada como completa!');
      },
      error => {
        console.error('Erro ao marcar avaliação como completa:', error);
      }
    );
  }

  updateAnswer(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;

    if (value === '') return;

    const answerNumber = Number(value);

    if (index > -1 && index < this.answers.length) {
      this.answers[index].answerNumber = answerNumber;
    }
  }



  // updateSixMonthAlignment() {
  //   const alignmentData = this.evaluationForm.value;
  
  //   const sixMonthAlignmentValue = `
  // ALINHAMENTO SEMESTRAL (Considerações)
  
  // Data: ${this.formatDateString(alignmentData.date)}
  
  // Plano de melhoria traçado está em andamento? ${alignmentData.planoAndamento}
  // Justificativa:
  // ${alignmentData.justificativaPlano}
  
  // Metas estabelecidas estão em andamento? ${alignmentData.metasAndamento}
  // Justifique:
  // ${alignmentData.justificativaMetas}
  
  // Resultados do Semestre considerados: ${alignmentData.resultadosSemestre}
  
  // Considerações sobre a análise e alinhamentos:
  // ${alignmentData.consideracoesAnalise}
  //   `;
  
  //   this.evaluationForm.get('sixMonthAlignment').setValue(sixMonthAlignmentValue, { emitEvent: false });
  // }
  
  private formatDateString(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
}
