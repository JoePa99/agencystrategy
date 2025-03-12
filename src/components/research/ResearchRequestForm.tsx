// src/components/research/ResearchRequestForm.tsx
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { PlusIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { createResearchRequest } from '@/firebase/firestore';
// Use the HTTP version that works better with SSR
import { executeResearchHttp } from '@/services/ai-http';
import { useAuth } from '@/context/AuthContext';

interface ResearchRequestFormProps {
  projectId: string;
  onRequestCreated?: (researchId: string) => void;
  onError?: (error: Error) => void;
}

type SourceType = 'web' | 'document' | 'specific_url';

interface FormValues {
  title: string;
  description: string;
  topics: { value: string }[];
  questions: { value: string }[];
  sources: { type: SourceType; value: string }[];
  output_format: 'report' | 'bullet_points' | 'presentation';
  priority: 'low' | 'medium' | 'high';
}

export default function ResearchRequestForm({ 
  projectId, 
  onRequestCreated, 
  onError 
}: ResearchRequestFormProps) {
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      topics: [{ value: '' }],
      questions: [{ value: '' }],
      sources: [{ type: 'web', value: '' }],
      output_format: 'report',
      priority: 'medium'
    }
  });
  
  const {
    fields: topicFields,
    append: appendTopic,
    remove: removeTopic
  } = useFieldArray({
    control,
    name: 'topics'
  });
  
  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion
  } = useFieldArray({
    control,
    name: 'questions'
  });
  
  const {
    fields: sourceFields,
    append: appendSource,
    remove: removeSource
  } = useFieldArray({
    control,
    name: 'sources'
  });
  
  const onSubmit = async (data: FormValues) => {
    if (!userProfile) return;
    
    setIsSubmitting(true);
    
    try {
      // Format data for Firestore
      const formattedTopics = data.topics.map(t => t.value).filter(Boolean);
      const formattedQuestions = data.questions.map(q => q.value).filter(Boolean);
      const formattedSources = data.sources
        .filter(s => s.value.trim() !== '')
        .map(s => ({
          type: s.type,
          value: s.value
        }));
      
      // Create research request
      const researchId = await createResearchRequest({
        title: data.title,
        description: data.description,
        projectId,
        organizationId: userProfile.organizationId || '',
        createdBy: userProfile.uid,
        status: 'pending',
        parameters: {
          topics: formattedTopics,
          questions: formattedQuestions,
          sources: formattedSources,
          output_format: data.output_format,
          priority: data.priority,
        },
        reviews: []
      });
      
      // Start research process - using HTTP version
      try {
        await executeResearchHttp(researchId);
      } catch (error) {
        console.warn('Failed to start research via HTTP, falling back to mock', error);
        // Just proceed - we'll let the user continue even if the research start fails
      }
      
      // Call callback if provided
      if (onRequestCreated) {
        onRequestCreated(researchId);
      }
    } catch (error) {
      console.error('Error creating research request:', error);
      
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700">
          Research title
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="title"
            className="input-field"
            {...register('title', {
              required: 'Title is required'
            })}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
          Description
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            rows={3}
            className="input-field"
            {...register('description', {
              required: 'Description is required'
            })}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Topics to research
        </label>
        <div className="space-y-2">
          {topicFields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder={`Topic ${index + 1}`}
                {...register(`topics.${index}.value`, {
                  required: index === 0 ? 'At least one topic is required' : false
                })}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeTopic(index)}
                  className="text-neutral-400 hover:text-neutral-500"
                >
                  <MinusCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
          {errors.topics && errors.topics[0]?.value && (
            <p className="mt-1 text-sm text-red-600">{errors.topics[0].value.message}</p>
          )}
          <button
            type="button"
            onClick={() => appendTopic({ value: '' })}
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add topic
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Questions to answer
        </label>
        <div className="space-y-2">
          {questionFields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder={`Question ${index + 1}`}
                {...register(`questions.${index}.value`)}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="text-neutral-400 hover:text-neutral-500"
                >
                  <MinusCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendQuestion({ value: '' })}
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add question
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Research sources
        </label>
        <div className="space-y-2">
          {sourceFields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <select
                className="max-w-xs rounded-md border-0 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                {...register(`sources.${index}.type`)}
              >
                <option value="web">Web search</option>
                <option value="document">Project document</option>
                <option value="specific_url">Specific URL</option>
              </select>
              <input
                type="text"
                className="input-field flex-1"
                placeholder={`Source ${index + 1}`}
                {...register(`sources.${index}.value`)}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeSource(index)}
                  className="text-neutral-400 hover:text-neutral-500"
                >
                  <MinusCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendSource({ type: 'web', value: '' })}
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add source
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="output_format" className="block text-sm font-medium text-neutral-700">
            Output format
          </label>
          <select
            id="output_format"
            className="mt-1 block w-full rounded-md border-0 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            {...register('output_format')}
          >
            <option value="report">Detailed report</option>
            <option value="bullet_points">Bullet points</option>
            <option value="presentation">Presentation-ready</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-neutral-700">
            Priority
          </label>
          <select
            id="priority"
            className="mt-1 block w-full rounded-md border-0 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            {...register('priority')}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating request...' : 'Create research request'}
        </button>
      </div>
    </form>
  );
}