import React from 'react';
import { HypothesisTesting } from './HypothesisTesting';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DataField } from '@/types/data';

interface HypothesisAnalysisProps {
  fields: DataField[];
}

export const HypothesisAnalysis: React.FC<HypothesisAnalysisProps> = ({ fields }) => {
  return (
    <div className="w-full p-4">
      <div className="bg-blue-600 text-white p-4 mb-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">Hypothesis Analysis</h2>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="testing">
          <AccordionTrigger className="text-lg font-medium">
            Hypothesis Testing
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-white rounded-lg shadow">
              <HypothesisTesting fields={fields} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="insights">
          <AccordionTrigger className="text-lg font-medium">
            Analysis Insights
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-gray-50 rounded-lg">
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600">•</span>
                  <span>Test results help determine if there's significant evidence to support or reject hypotheses about your data.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600">•</span>
                  <span>The p-value indicates the probability of obtaining test results at least as extreme as the observed results, assuming the null hypothesis is true.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600">•</span>
                  <span>A smaller p-value (typically &lt; 0.05) suggests stronger evidence against the null hypothesis.</span>
                </li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}; 