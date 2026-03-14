import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { EmplacementsComponent } from './emplacements.component';

describe('EmplacementsComponent', () => {
  let component: EmplacementsComponent;
  let fixture: ComponentFixture<EmplacementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmplacementsComponent ],
      imports: [ DragDropModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmplacementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});