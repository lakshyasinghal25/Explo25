from rest_framework import viewsets
from rest_framework.response import Response
from .models import SentencePair, Alignment
from .serializers import SentencePairSerializer, AlignmentSerializer
from rest_framework.decorators import action
from rest_framework import status


class SentencePairViewSet(viewsets.ModelViewSet):
    queryset = SentencePair.objects.all()
    serializer_class = SentencePairSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Update the sentence pair text
        instance.source_sentence = request.data.get('source_sentence', instance.source_sentence)
        instance.target_sentence = request.data.get('target_sentence', instance.target_sentence)
        instance.save()
        
        # If sentences have changed, the alignments may no longer be valid
        # You might want to delete existing alignments or adjust them
        # For simplicity, we'll delete them here
        Alignment.objects.filter(sentence_pair=instance).delete()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class AlignmentViewSet(viewsets.ModelViewSet):
    queryset = Alignment.objects.all()
    serializer_class = AlignmentSerializer
    
    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['delete'], url_path='reset-all')
    def reset_all(self, request):
        Alignment.objects.all().delete()
        return Response({"message": "All alignments deleted."}, status=status.HTTP_204_NO_CONTENT)
